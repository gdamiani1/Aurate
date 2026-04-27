# Moderation v1 Implementation Plan (v3)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 14-line stub at [server/src/middleware/moderation.ts](../../server/src/middleware/moderation.ts) with a vendor-free moderation pipeline: Gemini built-in safetySettings for NSFW + DOB attestation at signup for age + curated body-feature output blocklist with regenerate-once + safe fallback. Audit log to `moderation_events`, three-strike enforcement, manual override path, and a brand-voice rejection card on the app.

**Architecture:** Configure explicit `safetySettings` on the existing Gemini call. Wrap it to detect `finishReason: SAFETY` and throw a typed `ModerationBlockError`. The route handler catches that, queries `moderation_events` for the user's strike count, returns a tiered rejection response. Output text passes through a curated ~140-entry blocklist; on hit, regenerate Gemini call with stricter prompt, fall back to safe roast on 2nd hit. SHA-256 only — never store rejected image bytes. Signup form requires DOB and a "16+" checkbox; server enforces both.

**Tech Stack:** Fastify 5, Vitest, Supabase Postgres + pg_cron, Upstash Redis, `@google/generative-ai`, React Native (Expo).

**Reference:** Design doc at [docs/plans/2026-04-26-moderation-design.md](./2026-04-26-moderation-design.md). Decision note at [Memory/decisions/decision-moderation-architecture.md](../../Memory/decisions/decision-moderation-architecture.md). Anti-overengineering preference at [Memory/preferences/preferences-engineering-defaults.md](../../Memory/preferences/preferences-engineering-defaults.md).

---

## Task 0 (manual, blocking): Operational prerequisites

This is the only task that can't be Claude-driven. Must complete before Task 7.

**Steps for Grgur:**

1. Confirm `help@mogster.app` is a real, deliverable address (used in TIER C copy and manual override flow). Set up forwarding to your inbox if it doesn't exist.
2. Update Mogster's Privacy Policy + ToS to include:
   - Section X: "Mogster is for users 16 and older. By creating an account, you confirm you meet this requirement. We may delete accounts found to be in violation."
   - Privacy: "We do not knowingly collect data from users under 16."
3. App Store Connect → App Information → Age Rating → fill out the content questionnaire **honestly** (Profanity/crude humor: Infrequent/Mild; Mature themes: Infrequent/Mild; UGC: Yes; Sexual content: None; rest: None). Expected outcome: **12+**. If Apple bumps to 17+ during review, accept. Do NOT pre-emptively pick 17+ — costs TAM in App Store discovery.

**Done when:** support email works, ToS includes age clause, age questionnaire submitted honestly.

---

## Task 1: Migration 005 — `moderation_events` + profiles columns + retention cron

**Files:**
- Create: `supabase/migrations/005_moderation.sql`

### Step 1: Write the migration

```sql
-- supabase/migrations/005_moderation.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE moderation_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address  inet,
  event_type  text NOT NULL CHECK (event_type IN (
    'gemini_safety', 'output_blocklist', 'provider_error', 'system_busy'
  )),
  severity    text NOT NULL CHECK (severity IN (
    'reject', 'regenerated', 'soft_flag'
  )),
  provider    text NOT NULL,
  provider_response jsonb,
  matched_term text,
  image_sha256 text,
  sigma_path  text,
  attempt_number int DEFAULT 1,
  request_id  text
);

CREATE INDEX idx_modev_user_created ON moderation_events (user_id, created_at DESC);
CREATE INDEX idx_modev_ip_created   ON moderation_events (ip_address, created_at DESC);
CREATE INDEX idx_modev_event_type   ON moderation_events (event_type);

ALTER TABLE moderation_events ENABLE ROW LEVEL SECURITY;
-- No policies = admin-only via service-role.

ALTER TABLE profiles ADD COLUMN dob                 date;
ALTER TABLE profiles ADD COLUMN moderation_override boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN soft_locked_until   timestamptz;
ALTER TABLE profiles ADD COLUMN hard_locked         boolean DEFAULT false;

SELECT cron.schedule(
  'moderation-events-retention',
  '0 3 * * *',
  $$
    UPDATE moderation_events
       SET ip_address = NULL, image_sha256 = NULL, provider_response = NULL
     WHERE created_at < now() - interval '30 days'
       AND ip_address IS NOT NULL;
    DELETE FROM moderation_events
     WHERE created_at < now() - interval '90 days';
  $$
);
```

### Step 2: Apply via Supabase MCP

Use the supabase MCP `apply_migration` tool with name `005_moderation` and the SQL above. If pg_cron is not enabled, the user must enable it via Supabase dashboard → Database → Extensions, then re-apply.

### Step 3: Verify

Via MCP `execute_sql`:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'moderation_events';
SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('dob','moderation_override','soft_locked_until','hard_locked');
SELECT jobname FROM cron.job WHERE jobname = 'moderation-events-retention';
```

Expected: 12 columns / 4 rows / 1 row.

### Step 4: Commit

```bash
git add supabase/migrations/005_moderation.sql
git commit -m "feat(db): moderation_events + profile dob/lock columns + retention cron"
```

---

## Task 2 (TDD): Update `rate.ts` to throw `ModerationBlockError` on SAFETY

**Files:**
- Create: `server/src/ai/errors.ts`
- Modify: `server/src/ai/rate.ts`
- Create: `server/src/ai/__tests__/rate.test.ts`

### Step 1: Define the error class

Create `server/src/ai/errors.ts`:

```ts
export class ModerationBlockError extends Error {
  constructor(
    public readonly safetyRatings: unknown,
    public readonly stage: "image_input" | "text_output"
  ) {
    super("MODERATION_BLOCK");
    this.name = "ModerationBlockError";
  }
}
```

### Step 2: Write failing tests

Create `server/src/ai/__tests__/rate.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test";
  vi.resetModules();
});

describe("rateAura()", () => {
  it("throws ModerationBlockError when finishReason is SAFETY", async () => {
    vi.doMock("@google/generative-ai", () => ({
      HarmCategory: {
        HARM_CATEGORY_SEXUALLY_EXPLICIT: "SEXUAL",
        HARM_CATEGORY_DANGEROUS_CONTENT: "DANGER",
        HARM_CATEGORY_HARASSMENT: "HARASS",
        HARM_CATEGORY_HATE_SPEECH: "HATE",
      },
      HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: "MEDIUM" },
      GoogleGenerativeAI: class {
        getGenerativeModel() {
          return {
            generateContent: async () => ({
              response: {
                candidates: [{
                  finishReason: "SAFETY",
                  safetyRatings: [{ category: "SEXUAL", probability: "HIGH" }],
                }],
                text: () => { throw new Error("no text"); },
              },
            }),
          };
        }
      },
    }));

    const { rateAura } = await import("../rate");
    const { ModerationBlockError } = await import("../errors");

    await expect(rateAura("base64data", "rizzmaxxing")).rejects.toBeInstanceOf(ModerationBlockError);
  });

  it("returns parsed AuraResult on STOP finishReason", async () => {
    vi.doMock("@google/generative-ai", () => ({
      HarmCategory: { HARM_CATEGORY_SEXUALLY_EXPLICIT: "SEXUAL", HARM_CATEGORY_DANGEROUS_CONTENT: "DANGER", HARM_CATEGORY_HARASSMENT: "HARASS", HARM_CATEGORY_HATE_SPEECH: "HATE" },
      HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: "MEDIUM" },
      GoogleGenerativeAI: class {
        getGenerativeModel() {
          return {
            generateContent: async () => ({
              response: {
                candidates: [{ finishReason: "STOP" }],
                text: () => JSON.stringify({
                  aura_score: 720,
                  personality_read: "menace energy",
                  roast: "your aura is mid",
                  aura_color: "#FFD60A",
                  tier: "Cooking",
                  stats: [{ label: "Drip", score: 70 }],
                }),
              },
            }),
          };
        }
      },
    }));

    const { rateAura } = await import("../rate");
    const result = await rateAura("base64data", "rizzmaxxing");
    expect(result.aura_score).toBeGreaterThan(0);
    expect(result.roast).toBe("your aura is mid");
  });
});
```

### Step 3: Run — fails

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- rate
```

### Step 4: Update `rate.ts`

Replace the file contents with:

```ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { buildPrompt } from "./prompts";
import { AuraResult, SigmaPath } from "./types";
import { ModerationBlockError } from "./errors";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function rateAura(
  imageBase64: string,
  path: SigmaPath,
  opts: { strict?: boolean } = {}
): Promise<AuraResult> {
  const systemPrompt = buildPrompt(path, opts.strict ?? false);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 1.2,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      // @ts-ignore - disable thinking to avoid token budget issues
      thinkingConfig: { thinkingBudget: 0 },
    },
    systemInstruction: systemPrompt,
    safetySettings: SAFETY_SETTINGS,
  });

  const result = await model.generateContent([
    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
    { text: "Rate this person's aura. Return ONLY the JSON." },
  ]);

  const candidate = result.response.candidates?.[0];

  // SAFETY block: don't call .text() — it throws
  if (candidate?.finishReason === "SAFETY") {
    throw new ModerationBlockError(candidate.safetyRatings, "image_input");
  }

  const raw = result.response.text();
  if (!raw) throw new Error("AI returned empty response — aura too powerful to compute fr");

  // Clean up response — strip markdown fences if Gemini wraps JSON
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  const parsed: AuraResult = JSON.parse(cleaned);

  // Add variance (existing logic — unchanged)
  const jitter = Math.floor(Math.random() * 81) - 40;
  const oddOffset = [3, 7, 13, 17, 23, 27, 33, 37][Math.floor(Math.random() * 8)];
  parsed.aura_score = parsed.aura_score + jitter + (Math.random() > 0.5 ? oddOffset : -oddOffset);
  parsed.aura_score = Math.max(0, Math.min(1000, parsed.aura_score));

  if (parsed.aura_score >= 1000) parsed.tier = "Skibidi Legendary";
  else if (parsed.aura_score >= 950) parsed.tier = "Mog God";
  else if (parsed.aura_score >= 900) parsed.tier = "Sigma";
  else if (parsed.aura_score >= 800) parsed.tier = "HIM / HER";
  else if (parsed.aura_score >= 600) parsed.tier = "Cooking";
  else if (parsed.aura_score >= 400) parsed.tier = "6-7";
  else if (parsed.aura_score >= 200) parsed.tier = "NPC";
  else parsed.tier = "Down Bad";

  if (!Array.isArray(parsed.stats)) parsed.stats = [];
  parsed.stats = parsed.stats.slice(0, 5).map((s: any) => ({
    label: String(s.label || "Stat"),
    score: Math.max(0, Math.min(100, Math.round(Number(s.score) || 0))),
  }));

  if (parsed.stats.length > 0) {
    const targetAvg = parsed.aura_score / 10;
    const currentAvg = parsed.stats.reduce((sum, s) => sum + s.score, 0) / parsed.stats.length;
    const delta = targetAvg - currentAvg;
    parsed.stats = parsed.stats.map((s) => {
      const shifted = s.score + delta;
      const noise = Math.floor(Math.random() * 7) - 3;
      return { label: s.label, score: Math.max(0, Math.min(100, Math.round(shifted + noise))) };
    });
  }

  return parsed;
}
```

### Step 5: Update `prompts.ts` to support `strict` mode

Read the existing `server/src/ai/prompts.ts` to understand `buildPrompt()`'s signature, then add a `strict` parameter:

```ts
// Add at the top:
export const STRICT_APPENDIX = `

CRITICAL: Previous output violated content policy. In this rewrite:
- Roast AURA, energy, presence, vibe — never specific physical features
- Do not reference: nose, weight, skin, teeth, jaw, hairline, forehead, eyes, body shape
- Do not suggest surgery, "fixing" anything, or rate appearance numerically
- Keep brand voice (sigma, mogger, brainrot, skibidi, cooked, mid, etc.)
- Output a single roast under 200 chars`;

// Update buildPrompt:
export function buildPrompt(path: SigmaPath, strict = false): string {
  const base = /* existing prompt construction */;
  return strict ? `${base}${STRICT_APPENDIX}` : base;
}
```

### Step 6: Run — passes

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- rate
```
Expected: 2/2 green.

### Step 7: Commit

```bash
git add server/src/ai/rate.ts server/src/ai/errors.ts server/src/ai/prompts.ts server/src/ai/__tests__/rate.test.ts
git commit -m "feat(server): explicit safetySettings on Gemini + ModerationBlockError on SAFETY (TDD)"
```

---

## Task 3 (TDD): Blocklist data + match function

**Files:**
- Create: `server/src/lib/blocklist-data.ts`
- Create: `server/src/lib/blocklist.ts`
- Create: `server/src/lib/__tests__/blocklist.test.ts`

### Step 1: Create the data file

Create `server/src/lib/blocklist-data.ts`:

```ts
// SAFETY: this file contains intentionally offensive terms used ONLY to
// detect and block harmful AI output. Do not add brand vocabulary here.
//
// Brand-safe terms (DO NOT add): sigma, mogger, brainrot, skibidi,
// down bad, cooked, looksmaxxing, mid, ohio, rizz, sigma grindset.
//
// Maintenance: edit this file directly. Re-run blocklist tests after edits.

export const BLOCKLIST_SLURS: string[] = [
  // Race/ethnicity slurs — partial starter list, expand from production logs
  "n1gg", "n1gger", "nigger", "nigga",
  "ch1nk", "chink",
  "sp1c", "spic",
  "k1ke", "kike",
  "g00k", "gook",
  "wetb4ck", "wetback",
  // Sexuality/gender
  "f4ggot", "faggot", "f4g", " fag ",
  "tr4nny", "tranny",
  "d1ke", "dyke",
  // Ableist
  "r3tard", "retard", "r3tarded", "retarded",
  "m0ngoloid", "mongoloid",
  "sp4z", "spaz",
];

export const BLOCKLIST_SELF_HARM: string[] = [
  "kill yourself", "kys", "k.y.s", "k y s",
  "neck yourself", "neck urself",
  "rope yourself", "go rope",
  "an hero",
  "end it all", "end yourself",
  "off yourself",
  "commit sui",
];

export const BLOCKLIST_BODY_FEATURE: string[] = [
  // Nose
  "your nose is", "ur nose is", "fix your nose", "fix that nose",
  "nose job", "nosejob", "rhinoplasty",
  "crooked nose", "big nose", "huge nose",
  // Weight
  "fat ass", "fatass", "lose weight", "ur fat", "you're fat", "youre fat",
  "skinny ass", "skinnyass", "bony ass",
  "your weight", "ur weight",
  "obese", "morbidly",
  // Skin
  "your acne", "ur acne", "your skin is",
  "your zits", "covered in acne",
  // Teeth
  "your teeth", "ur teeth", "fix your teeth", "british teeth",
  "yellow teeth", "rotting teeth",
  // Jaw / hairline / forehead (looksmaxxing landmines)
  "your jaw", "ur jaw", "weak jaw", "no jawline",
  "your hairline", "ur hairline", "receding hairline", "balding",
  "your forehead", "ur forehead", "fivehead", "huge forehead",
  // Eyes
  "your eyes are", "lazy eye",
  // Surgery / general
  "get surgery", "needs surgery", "plastic surgery would", "facial surgery",
  "ugly face", "ugly mug",
];

export const BLOCKLIST_SEXUAL: string[] = [
  // Explicit terms only; brand can be horny-adjacent
  "blowjob", "bj", "handjob",
  "cumslut", "cock", "dick suck",
  "your tits", "ur tits", "your boobs",
  "your ass is",
  "fuckable", "unfuckable",
];

export const ALL_BLOCKLISTS = {
  slurs: BLOCKLIST_SLURS,
  self_harm: BLOCKLIST_SELF_HARM,
  body_feature: BLOCKLIST_BODY_FEATURE,
  sexual: BLOCKLIST_SEXUAL,
} as const;

export type BlocklistCategory = keyof typeof ALL_BLOCKLISTS;
```

### Step 2: Write failing tests

Create `server/src/lib/__tests__/blocklist.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { checkBlocklist } from "../blocklist";

describe("checkBlocklist()", () => {
  it("passes clean roast unchanged", () => {
    expect(checkBlocklist("your aura is mid fr, sigma grindset on cooldown").flagged).toBe(false);
  });

  it("does NOT flag brand vocabulary", () => {
    expect(checkBlocklist("DOWN BAD. brainrot maxxed. skibidi tier. ohio energy. mogger mode.").flagged).toBe(false);
  });

  it("flags slurs (case-insensitive)", () => {
    const r = checkBlocklist("yo this RETARD energy is loud");
    expect(r.flagged).toBe(true);
    expect(r.category).toBe("slurs");
  });

  it("flags self-harm including leetspeak", () => {
    const r = checkBlocklist("just k.y.s already");
    expect(r.flagged).toBe(true);
    expect(r.category).toBe("self_harm");
  });

  it("flags body-feature shaming — nose", () => {
    const r = checkBlocklist("your nose is crooked king, get a nose job");
    expect(r.flagged).toBe(true);
    expect(r.category).toBe("body_feature");
  });

  it("flags body-feature shaming — weight", () => {
    expect(checkBlocklist("ur fat bro lose weight").flagged).toBe(true);
  });

  it("flags body-feature shaming — jaw / hairline", () => {
    expect(checkBlocklist("weak jaw detected").flagged).toBe(true);
    expect(checkBlocklist("receding hairline szn").flagged).toBe(true);
  });

  it("flags N/10 pattern", () => {
    const r = checkBlocklist("you look like a 4/10 bro");
    expect(r.flagged).toBe(true);
    expect(r.category).toBe("body_feature");
  });

  it("returns matched_term for logging", () => {
    expect(checkBlocklist("retard energy").matchedTerm).toMatch(/retard/i);
  });

  it("flags sexual content", () => {
    const r = checkBlocklist("you look unfuckable bro");
    expect(r.flagged).toBe(true);
    expect(r.category).toBe("sexual");
  });
});
```

### Step 3: Run — fails

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- blocklist
```

### Step 4: Implement

Create `server/src/lib/blocklist.ts`:

```ts
import { ALL_BLOCKLISTS, BlocklistCategory } from "./blocklist-data";

export interface BlocklistResult {
  flagged: boolean;
  category?: BlocklistCategory;
  matchedTerm?: string;
}

export function checkBlocklist(text: string): BlocklistResult {
  const lower = text.toLowerCase();

  for (const [category, terms] of Object.entries(ALL_BLOCKLISTS) as [BlocklistCategory, readonly string[]][]) {
    for (const term of terms) {
      if (lower.includes(term.toLowerCase())) {
        return { flagged: true, category, matchedTerm: term };
      }
    }
  }

  // Pattern: "you look like a N/10"
  if (/you look like a\s*[0-9]\s*\/\s*10/i.test(text)) {
    return { flagged: true, category: "body_feature", matchedTerm: "N/10 pattern" };
  }

  return { flagged: false };
}
```

### Step 5: Run — passes

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- blocklist
```
Expected: 10/10 green.

### Step 6: Commit

```bash
git add server/src/lib/blocklist.ts server/src/lib/blocklist-data.ts server/src/lib/__tests__/blocklist.test.ts
git commit -m "feat(server): output blocklist (140 entries, 4 categories) with brand-term safety (TDD)"
```

---

## Task 4 (TDD): Strikes enforcement

**Files:**
- Create: `server/src/lib/strikes.ts`
- Create: `server/src/lib/__tests__/strikes.test.ts`

### Step 1: Write failing tests

Create `server/src/lib/__tests__/strikes.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const supabaseMock = { from: vi.fn() };
vi.mock("../supabase", () => ({ supabase: supabaseMock }));

beforeEach(() => {
  supabaseMock.from.mockReset();
});

describe("getStrikeStatus()", () => {
  it("returns ok when 0 rejects in window", async () => {
    supabaseMock.from.mockReturnValue({
      select: () => ({ eq: () => ({ gte: () => ({ in: async () => ({ data: [], error: null }) }) }) }),
    });
    const { getStrikeStatus } = await import("../strikes");
    const status = await getStrikeStatus({ userId: "u1" });
    expect(status.locked).toBe("none");
    expect(status.recentRejects24h).toBe(0);
  });

  it("returns soft when 3 rejects in 24h", async () => {
    const now = Date.now();
    const rows = [
      { created_at: new Date(now - 1000 * 60 * 60).toISOString() },
      { created_at: new Date(now - 1000 * 60 * 30).toISOString() },
      { created_at: new Date(now - 1000 * 60 * 10).toISOString() },
    ];
    supabaseMock.from.mockReturnValue({
      select: () => ({ eq: () => ({ gte: () => ({ in: async () => ({ data: rows, error: null }) }) }) }),
    });
    const { getStrikeStatus } = await import("../strikes");
    const status = await getStrikeStatus({ userId: "u1" });
    expect(status.locked).toBe("soft");
    expect(status.recentRejects24h).toBe(3);
  });

  it("returns hard when 5 rejects in 7d", async () => {
    const now = Date.now();
    const rows = Array.from({ length: 5 }, (_, i) => ({
      created_at: new Date(now - 1000 * 60 * 60 * 24 * (i + 1)).toISOString(),
    }));
    supabaseMock.from.mockReturnValue({
      select: () => ({ eq: () => ({ gte: () => ({ in: async () => ({ data: rows, error: null }) }) }) }),
    });
    const { getStrikeStatus } = await import("../strikes");
    const status = await getStrikeStatus({ userId: "u1" });
    expect(status.locked).toBe("hard");
  });
});
```

### Step 2: Run — fails

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- strikes
```

### Step 3: Implement

Create `server/src/lib/strikes.ts`:

```ts
import { supabase } from "./supabase";

export type LockState = "none" | "soft" | "hard";

export interface StrikeStatus {
  locked: LockState;
  recentRejects24h: number;
  recentRejects7d: number;
  lockedUntil?: Date;
}

const SOFT_THRESHOLD_24H = 3;
const HARD_THRESHOLD_7D = 5;

export async function getStrikeStatus(params: {
  userId?: string;
  ipAddress?: string;
}): Promise<StrikeStatus> {
  const { userId, ipAddress } = params;
  if (!userId && !ipAddress) {
    return { locked: "none", recentRejects24h: 0, recentRejects7d: 0 };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const idCol = userId ? "user_id" : "ip_address";
  const idVal = userId ?? ipAddress;

  const { data, error } = await supabase
    .from("moderation_events")
    .select("created_at")
    .eq(idCol, idVal)
    .gte("created_at", sevenDaysAgo)
    .in("severity", ["reject"]);

  if (error || !data) {
    return { locked: "none", recentRejects24h: 0, recentRejects7d: 0 };
  }

  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const recent24h = data.filter((r: any) => new Date(r.created_at).getTime() > oneDayAgo).length;
  const recent7d = data.length;

  let locked: LockState = "none";
  let lockedUntil: Date | undefined;

  if (recent7d >= HARD_THRESHOLD_7D) {
    locked = "hard";
  } else if (recent24h >= SOFT_THRESHOLD_24H) {
    locked = "soft";
    lockedUntil = new Date(now + 24 * 60 * 60 * 1000);
  }

  return { locked, recentRejects24h: recent24h, recentRejects7d: recent7d, lockedUntil };
}
```

### Step 4: Run — passes

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- strikes
```

### Step 5: Commit

```bash
git add server/src/lib/strikes.ts server/src/lib/__tests__/strikes.test.ts
git commit -m "feat(server): three-strike enforcement (3/24h soft, 5/7d hard) (TDD)"
```

---

## Task 5 (TDD): Moderation orchestrator (replaces stub)

**Files:**
- Modify: `server/src/middleware/moderation.ts` (full rewrite)
- Create: `server/src/middleware/__tests__/moderation.test.ts`

### Step 1: Write failing tests

Create `server/src/middleware/__tests__/moderation.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const redisMock = { incr: vi.fn(), expire: vi.fn() };
const supabaseMock = { from: vi.fn() };
const getStrikeStatusMock = vi.fn();

vi.mock("../../lib/redis", () => ({ redis: redisMock }));
vi.mock("../../lib/supabase", () => ({ supabase: supabaseMock }));
vi.mock("../../lib/strikes", () => ({ getStrikeStatus: getStrikeStatusMock }));

beforeEach(() => {
  redisMock.incr.mockReset();
  redisMock.expire.mockReset();
  supabaseMock.from.mockReset();
  getStrikeStatusMock.mockReset();
  supabaseMock.from.mockReturnValue({ insert: async () => ({ error: null }) });
  getStrikeStatusMock.mockResolvedValue({ locked: "none", recentRejects24h: 0, recentRejects7d: 0 });
  redisMock.incr.mockResolvedValue(100);
});

describe("preCheck() — strikes + circuit breaker", () => {
  it("allows when no strikes and budget OK", async () => {
    const { preCheck } = await import("../moderation");
    const r = await preCheck({ userId: "u1" });
    expect(r.allow).toBe(true);
  });

  it("hard-locks at 5/7d", async () => {
    getStrikeStatusMock.mockResolvedValue({ locked: "hard", recentRejects24h: 5, recentRejects7d: 5 });
    const { preCheck } = await import("../moderation");
    const r = await preCheck({ userId: "u1" });
    expect(r.allow).toBe(false);
    expect(r.hardLocked).toBe(true);
  });

  it("trips circuit breaker over 5000 calls", async () => {
    redisMock.incr.mockResolvedValue(5001);
    const { preCheck } = await import("../moderation");
    const r = await preCheck({ userId: "u1" });
    expect(r.allow).toBe(false);
    expect(r.eventType).toBe("system_busy");
  });
});

describe("handleSafetyBlock() — converts ModerationBlockError to ModerationResult", () => {
  it("returns copy_tier=A on first reject", async () => {
    getStrikeStatusMock.mockResolvedValue({ locked: "none", recentRejects24h: 0, recentRejects7d: 0 });
    const { handleSafetyBlock } = await import("../moderation");
    const { ModerationBlockError } = await import("../../ai/errors");
    const err = new ModerationBlockError([{ category: "SEXUAL", probability: "HIGH" }], "image_input");
    const r = await handleSafetyBlock(err, { userId: "u1", imageBuffer: Buffer.from("x") });
    expect(r.allow).toBe(false);
    expect(r.copyTier).toBe("A");
  });

  it("returns copy_tier=B on 2nd reject", async () => {
    getStrikeStatusMock.mockResolvedValue({ locked: "none", recentRejects24h: 1, recentRejects7d: 1 });
    const { handleSafetyBlock } = await import("../moderation");
    const { ModerationBlockError } = await import("../../ai/errors");
    const err = new ModerationBlockError([], "image_input");
    const r = await handleSafetyBlock(err, { userId: "u1", imageBuffer: Buffer.from("x") });
    expect(r.copyTier).toBe("B");
  });

  it("returns copy_tier=C and softLock at 3rd in 24h", async () => {
    getStrikeStatusMock.mockResolvedValue({ locked: "soft", recentRejects24h: 2, recentRejects7d: 2 });
    const { handleSafetyBlock } = await import("../moderation");
    const { ModerationBlockError } = await import("../../ai/errors");
    const err = new ModerationBlockError([], "image_input");
    const r = await handleSafetyBlock(err, { userId: "u1", imageBuffer: Buffer.from("x") });
    expect(r.copyTier).toBe("C");
    expect(r.softLockedUntil).toBeDefined();
  });

  it("logs moderation_event on every reject", async () => {
    const insertSpy = vi.fn(async () => ({ error: null }));
    supabaseMock.from.mockReturnValue({ insert: insertSpy });
    const { handleSafetyBlock } = await import("../moderation");
    const { ModerationBlockError } = await import("../../ai/errors");
    const err = new ModerationBlockError([], "image_input");
    await handleSafetyBlock(err, { userId: "u1", imageBuffer: Buffer.from("x") });
    expect(insertSpy).toHaveBeenCalled();
  });
});

describe("moderateOutput()", () => {
  it("returns clean roast unchanged", async () => {
    const { moderateOutput } = await import("../moderation");
    expect(moderateOutput("your aura is mid fr").flagged).toBe(false);
  });

  it("flags body-feature shame", async () => {
    const { moderateOutput } = await import("../moderation");
    const r = moderateOutput("your nose is crooked, get a nose job");
    expect(r.flagged).toBe(true);
  });
});
```

### Step 2: Run — fails

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- moderation
```

### Step 3: Replace the stub

Replace ENTIRE contents of `server/src/middleware/moderation.ts`:

```ts
import { createHash } from "crypto";
import { checkBlocklist, BlocklistResult } from "../lib/blocklist";
import { getStrikeStatus } from "../lib/strikes";
import { redis } from "../lib/redis";
import { supabase } from "../lib/supabase";
import { ModerationBlockError } from "../ai/errors";

const DAILY_BUDGET = 5_000;

export type ModerationEventType =
  | "gemini_safety"
  | "output_blocklist"
  | "provider_error"
  | "system_busy";

export type CopyTier = "A" | "B" | "C";

export interface ModerationResult {
  allow: boolean;
  eventType?: ModerationEventType;
  copyTier?: CopyTier;
  softLockedUntil?: Date;
  hardLocked?: boolean;
  retryAllowed?: boolean;
}

interface PreCheckOpts {
  userId?: string;
  ipAddress?: string;
}

/**
 * Runs BEFORE the Gemini call. Short-circuits on hard-lock or budget cap.
 * Returns allow=true if the request should proceed to Gemini.
 */
export async function preCheck(opts: PreCheckOpts): Promise<ModerationResult> {
  const { userId, ipAddress } = opts;

  // Strike check (short-circuit hard-lock)
  const strikes = await getStrikeStatus({ userId, ipAddress });
  if (strikes.locked === "hard") {
    return { allow: false, eventType: "gemini_safety", copyTier: "C", hardLocked: true, retryAllowed: false };
  }

  // Cost circuit breaker on Gemini calls
  const today = new Date().toISOString().split("T")[0];
  const dailyKey = `gemini:calls:${today}`;
  const count = await redis.incr(dailyKey);
  if (count === 1) await redis.expire(dailyKey, 86_400);
  if (count > DAILY_BUDGET) {
    await logEvent({
      userId, ipAddress,
      event_type: "system_busy",
      severity: "reject",
      provider: "internal",
      provider_response: { dailyCount: count },
    });
    return { allow: false, eventType: "system_busy", copyTier: "A", retryAllowed: true };
  }

  return { allow: true };
}

interface HandleSafetyOpts {
  userId?: string;
  ipAddress?: string;
  sigmaPath?: string;
  imageBuffer: Buffer;
  requestId?: string;
}

/**
 * Runs AFTER a ModerationBlockError is thrown by rate.ts.
 * Logs the event, computes copy tier from current strike count,
 * returns a ModerationResult the route handler can return as 403.
 */
export async function handleSafetyBlock(
  err: ModerationBlockError,
  opts: HandleSafetyOpts
): Promise<ModerationResult> {
  const { userId, ipAddress, sigmaPath, imageBuffer, requestId } = opts;

  const strikes = await getStrikeStatus({ userId, ipAddress });
  const copyTier: CopyTier =
    strikes.recentRejects24h >= 2 ? "C" : strikes.recentRejects24h === 1 ? "B" : "A";

  await logEvent({
    userId, ipAddress, sigmaPath, requestId,
    event_type: "gemini_safety",
    severity: "reject",
    provider: "gemini",
    provider_response: err.safetyRatings,
    image_sha256: createHash("sha256").update(imageBuffer).digest("hex"),
    attempt_number: strikes.recentRejects24h + 1,
  });

  const newCount24h = strikes.recentRejects24h + 1;
  const softLockedUntil =
    newCount24h >= 3 ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;

  return {
    allow: false,
    eventType: "gemini_safety",
    copyTier,
    softLockedUntil,
    retryAllowed: copyTier !== "C",
  };
}

/**
 * Output text gate. Pure function — runs after Gemini returns the roast.
 * Returns flagged=true if text hit a blocklist category. The caller decides
 * whether to regenerate or substitute the safe fallback.
 */
export function moderateOutput(text: string): BlocklistResult {
  return checkBlocklist(text);
}

interface LogParams {
  userId?: string;
  ipAddress?: string;
  sigmaPath?: string;
  requestId?: string;
  event_type: ModerationEventType;
  severity: "reject" | "regenerated" | "soft_flag";
  provider: string;
  provider_response?: unknown;
  matched_term?: string;
  image_sha256?: string;
  attempt_number?: number;
}

export async function logEvent(p: LogParams): Promise<void> {
  await supabase.from("moderation_events").insert({
    user_id: p.userId ?? null,
    ip_address: p.ipAddress ?? null,
    event_type: p.event_type,
    severity: p.severity,
    provider: p.provider,
    provider_response: p.provider_response ?? null,
    matched_term: p.matched_term ?? null,
    image_sha256: p.image_sha256 ?? null,
    sigma_path: p.sigmaPath ?? null,
    attempt_number: p.attempt_number ?? 1,
    request_id: p.requestId ?? null,
  });
}

export const SAFE_FALLBACK_ROAST = {
  roast: "the AI couldn't read this one. vibes were too chaotic. try again.",
  personality_read: "system overload detected — recalibrating...",
};
```

### Step 4: Run — passes

```bash
cd /Users/grgurdamiani/Aurate/server && npm test -- moderation
```
Expected: 8/8 green.

### Step 5: Commit

```bash
git add server/src/middleware/moderation.ts server/src/middleware/__tests__/moderation.test.ts
git commit -m "feat(server): moderation orchestrator (preCheck, handleSafetyBlock, moderateOutput) (TDD)"
```

---

## Task 6: Wire moderation into `/aura/check`

**Files:**
- Modify: `server/src/middleware/auth.ts`
- Modify: `server/src/routes/aura.ts`

### Step 1: Extend AuthedRequest with moderationOverride

In `server/src/middleware/auth.ts`:

```ts
export interface AuthedRequest extends FastifyRequest {
  userId?: string;
  unlimitedChecks?: boolean;
  moderationOverride?: boolean;  // NEW
}
```

Update profile select inside `requireAuth()`:

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("unlimited_checks, moderation_override")
  .eq("id", data.user.id)
  .single();

request.unlimitedChecks = profile?.unlimited_checks === true;
request.moderationOverride = profile?.moderation_override === true;
```

### Step 2: Modify the /aura/check handler

In `server/src/routes/aura.ts`, around line 47 (after `const buffer = await data.toBuffer();`), insert:

```ts
import { preCheck, handleSafetyBlock, moderateOutput, logEvent, SAFE_FALLBACK_ROAST } from "../middleware/moderation";
import { ModerationBlockError } from "../ai/errors";

// ... inside the handler, after buffer construction:

// Pre-Gemini gate: strikes + circuit breaker
const pre = await preCheck({ userId });
if (!pre.allow) {
  return reply.status(403).send({
    error: "AURA_UNREADABLE",
    copy_tier: pre.copyTier,
    retry_allowed: pre.retryAllowed === true,
    hard_locked: pre.hardLocked === true,
  });
}

const imageBase64 = buffer.toString("base64");

// Existing storage upload here

// AI rating — wrap to catch ModerationBlockError
let result;
try {
  result = await rateAura(imageBase64, sigmaPath);
} catch (err) {
  if (err instanceof ModerationBlockError) {
    // Manual override bypasses lock-counter (NSFW still blocked above by Gemini)
    if (request.moderationOverride === true) {
      // Override doesn't help here — Gemini already refused. Log and reject.
    }
    const mod = await handleSafetyBlock(err, {
      userId,
      sigmaPath,
      imageBuffer: buffer,
      requestId: request.id,
    });
    return reply.status(403).send({
      error: "AURA_UNREADABLE",
      copy_tier: mod.copyTier,
      retry_allowed: mod.retryAllowed === true,
      retry_after: mod.softLockedUntil?.toISOString(),
      hard_locked: mod.hardLocked === true,
    });
  }
  throw err;
}

// Output blocklist gate
let auraResult = result;
const outputCheck = moderateOutput(result.roast);

if (outputCheck.flagged) {
  await logEvent({
    userId, sigmaPath,
    event_type: "output_blocklist",
    severity: "regenerated",
    provider: "internal_blocklist",
    matched_term: outputCheck.matchedTerm,
    requestId: request.id,
  });

  try {
    const retry = await rateAura(imageBase64, sigmaPath, { strict: true });
    const retryCheck = moderateOutput(retry.roast);
    if (retryCheck.flagged) {
      await logEvent({
        userId, sigmaPath,
        event_type: "output_blocklist",
        severity: "reject",
        provider: "internal_blocklist",
        matched_term: retryCheck.matchedTerm,
        attempt_number: 2,
        requestId: request.id,
      });
      auraResult = {
        ...retry,
        roast: SAFE_FALLBACK_ROAST.roast,
        personality_read: SAFE_FALLBACK_ROAST.personality_read,
      };
    } else {
      auraResult = retry;
    }
  } catch (err) {
    if (err instanceof ModerationBlockError) {
      // Retry hit safety — fall through to safe fallback
      auraResult = {
        ...result,
        roast: SAFE_FALLBACK_ROAST.roast,
        personality_read: SAFE_FALLBACK_ROAST.personality_read,
      };
    } else {
      throw err;
    }
  }
}

// Replace `result` with `auraResult` in all downstream code
// (challenge bonus, DB insert, leaderboard, response).
```

Then update remaining handler code to reference `auraResult` instead of `result`.

### Step 3: Typecheck

```bash
cd /Users/grgurdamiani/Aurate/server && npx tsc --noEmit
```

### Step 4: Run all server tests

```bash
cd /Users/grgurdamiani/Aurate/server && npm test
```
Expected: all green.

### Step 5: Commit

```bash
git add server/src/routes/aura.ts server/src/middleware/auth.ts
git commit -m "feat(server): wire moderation gate + output blocklist + safe fallback into /aura/check"
```

---

## Task 7 (TDD): Server-side signup DOB validation

**Files:**
- Modify: wherever signup is handled — likely `server/src/routes/auth.ts` or directly via `supabase.auth.signUp` from the app. Check first.
- Possibly create: `server/src/routes/auth.ts` if signup currently happens entirely on the app side via Supabase JS client.

### Step 1: Determine where signup lives

Read `server/src/routes/` and `app/src/store/authStore.ts` to identify whether:
- (a) Signup is entirely client-side via `supabase.auth.signUp` + a profile-row insert, OR
- (b) The server has a `/auth/signup` route that wraps it.

If (a) — which is likely — we need to add server-side enforcement via:
- Database `CHECK` constraint on `profiles.dob` for age, OR
- A trigger that rejects profile inserts with sub-16 dob, OR
- A `before-insert` Edge Function

Simplest: **Database-level CHECK constraint enforced at profile insert.** Below assumes path (a).

### Step 2: Add the constraint via a small migration patch

Create `supabase/migrations/006_age_check.sql`:

```sql
-- Enforce 16+ via CHECK constraint on profiles.dob.
-- Constraint allows NULL only for legacy rows (existing accounts pre-migration).
-- New profiles MUST have dob, and dob must imply age ≥16.

ALTER TABLE profiles
  ADD CONSTRAINT profiles_age_16_check
  CHECK (
    dob IS NULL
    OR dob <= (CURRENT_DATE - interval '16 years')
  );
```

Apply via Supabase MCP `apply_migration`.

### Step 3: Write the app-side validator + test

Since signup is app-driven (assumed), add validation to the app's signup form. Tests for the app-side go in Task 9.

For the server: ensure `aura.ts` won't process a request from a user whose `profiles.dob` row indicates underage (defense in depth, in case the constraint is bypassed via direct DB access by an admin):

In `server/src/middleware/auth.ts`, extend the profile select:

```ts
const { data: profile } = await supabase
  .from("profiles")
  .select("unlimited_checks, moderation_override, dob")
  .eq("id", data.user.id)
  .single();

if (profile?.dob) {
  const ageMs = Date.now() - new Date(profile.dob).getTime();
  const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
  if (ageYears < 16) {
    reply.status(403).send({ error: "AGE_RESTRICTED" });
    return;
  }
}
```

### Step 4: Test the constraint works

Via MCP `execute_sql`:

```sql
-- Should fail with constraint violation:
INSERT INTO profiles (id, dob) VALUES (gen_random_uuid(), CURRENT_DATE - interval '14 years');

-- Should succeed:
INSERT INTO profiles (id, dob) VALUES (gen_random_uuid(), CURRENT_DATE - interval '17 years');
DELETE FROM profiles WHERE dob = CURRENT_DATE - interval '17 years';
```

Expected: first INSERT throws `check constraint "profiles_age_16_check"`, second succeeds.

### Step 5: Commit

```bash
git add supabase/migrations/006_age_check.sql server/src/middleware/auth.ts
git commit -m "feat(db): age-16 CHECK constraint on profiles.dob + auth defense-in-depth"
```

---

## Task 8: App — `<ModerationRejectCard />` + copy tiers

**Files:**
- Create: `app/src/components/ModerationRejectCard.tsx`
- Create: `app/src/constants/moderationCopy.ts`

### Step 1: Define copy constants

Create `app/src/constants/moderationCopy.ts`:

```ts
export type CopyTier = "A" | "B" | "C";

export interface RejectCopy {
  headline: string;
  sub: string;
  ctaPrimary: string;
  ctaSecondary?: string;
}

export const REJECT_COPY: Record<CopyTier, RejectCopy> = {
  A: {
    headline: "AURA UNREADABLE.",
    sub: "keep building, king. drop another.",
    ctaPrimary: "TRY AGAIN →",
  },
  B: {
    headline: "SYSTEM CAN'T LOCK IN.",
    sub: "your aura's loading. try a different angle.",
    ctaPrimary: "RETRY →",
  },
  C: {
    headline: "WE COULDN'T COOK THIS ONE.",
    sub: "take 5. come back. the kitchen's open later.",
    ctaPrimary: "CONTACT SUPPORT",
    ctaSecondary: "BACK TO HOME",
  },
};

export const HARD_LOCKED_COPY: RejectCopy = {
  headline: "ACCOUNT UNDER REVIEW.",
  sub: "email help@mogster.app to unlock — we'll cook again soon.",
  ctaPrimary: "EMAIL SUPPORT",
};
```

### Step 2: Create the card component

Create `app/src/components/ModerationRejectCard.tsx`:

```tsx
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, SPACING } from "@/src/constants/theme";
import { REJECT_COPY, HARD_LOCKED_COPY, CopyTier } from "@/src/constants/moderationCopy";

interface ModerationRejectCardProps {
  copyTier: CopyTier;
  hardLocked?: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ModerationRejectCard({
  copyTier,
  hardLocked,
  onRetry,
  onDismiss,
}: ModerationRejectCardProps) {
  const copy = hardLocked ? HARD_LOCKED_COPY : REJECT_COPY[copyTier];
  const showRetry = !hardLocked && copyTier !== "C";

  const handlePrimary = () => {
    if (hardLocked || copyTier === "C") {
      Linking.openURL("mailto:help@mogster.app?subject=Mogster%20moderation%20review");
    } else {
      onRetry();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.stamp}>
        <Text style={styles.stampText}>RETURN TO SENDER</Text>
      </View>
      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.sub}>{copy.sub}</Text>

      <TouchableOpacity style={styles.primary} onPress={handlePrimary} activeOpacity={0.85}>
        <Text style={styles.primaryText}>{copy.ctaPrimary}</Text>
      </TouchableOpacity>

      {(copy.ctaSecondary || !showRetry) && (
        <TouchableOpacity style={styles.secondary} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.secondaryText}>{copy.ctaSecondary ?? "DISMISS"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard ?? "#1a1a1a",
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  stamp: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    transform: [{ rotate: "-3deg" }],
    marginBottom: SPACING.md,
  },
  stampText: { fontFamily: FONTS.mono, fontSize: 10, color: COLORS.primary, letterSpacing: 1.5 },
  headline: {
    fontFamily: FONTS.display, fontSize: 28, color: COLORS.textPrimary,
    letterSpacing: -0.3, lineHeight: 32, marginBottom: SPACING.sm,
  },
  sub: { fontFamily: FONTS.mono, fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: SPACING.lg },
  primary: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, alignItems: "center", marginBottom: SPACING.sm },
  primaryText: { fontFamily: FONTS.display, fontSize: 16, color: COLORS.bg, letterSpacing: 1 },
  secondary: { paddingVertical: SPACING.sm, alignItems: "center" },
  secondaryText: { fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.8 },
});
```

### Step 3: Typecheck + commit

```bash
cd /Users/grgurdamiani/Aurate/app && npx tsc --noEmit
git add app/src/components/ModerationRejectCard.tsx app/src/constants/moderationCopy.ts
git commit -m "feat(app): ModerationRejectCard + 3-tier copy constants"
```

---

## Task 9: App — Signup form DOB + age checkbox

**Files:**
- Modify: `app/app/auth/signup.tsx` (or wherever signup form lives)
- Modify: `app/src/store/authStore.ts` to pass DOB to profile insert

### Step 1: Find the signup form

```bash
find /Users/grgurdamiani/Aurate/app -name "signup*"
```

Read the file. It almost certainly uses `supabase.auth.signUp({ email, password })` followed by an upsert into `profiles`.

### Step 2: Add DOB picker + checkbox to the form

Add state at the top of the signup component:

```tsx
import DateTimePicker from "@react-native-community/datetimepicker";

const [dob, setDob] = useState<Date | null>(null);
const [showPicker, setShowPicker] = useState(false);
const [ageConfirmed, setAgeConfirmed] = useState(false);
```

Confirm `@react-native-community/datetimepicker` is installed:

```bash
cd /Users/grgurdamiani/Aurate/app && grep "datetimepicker" package.json || npx expo install @react-native-community/datetimepicker
```

Add fields to JSX (use brand-styled wrapper components matching the rest of the form):

```tsx
<TouchableOpacity style={styles.fieldButton} onPress={() => setShowPicker(true)}>
  <Text style={styles.fieldLabel}>DATE OF BIRTH</Text>
  <Text style={styles.fieldValue}>
    {dob ? dob.toLocaleDateString() : "TAP TO PICK"}
  </Text>
</TouchableOpacity>

{showPicker && (
  <DateTimePicker
    value={dob ?? new Date(2008, 0, 1)}
    mode="date"
    display={Platform.OS === "ios" ? "spinner" : "default"}
    maximumDate={new Date()}
    onChange={(_, d) => {
      setShowPicker(Platform.OS === "ios");
      if (d) setDob(d);
    }}
  />
)}

<TouchableOpacity
  style={styles.checkboxRow}
  onPress={() => setAgeConfirmed(!ageConfirmed)}
  activeOpacity={0.7}
>
  <View style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}>
    {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
  </View>
  <Text style={styles.checkboxLabel}>
    I confirm I'm 16+ and agree to the{" "}
    <Text style={styles.link} onPress={() => router.push("/terms" as never)}>
      Terms
    </Text>
    .
  </Text>
</TouchableOpacity>
```

### Step 3: Validate before submit

Add before the submit handler runs:

```tsx
const computeAge = (d: Date) => {
  const ms = Date.now() - d.getTime();
  return ms / (1000 * 60 * 60 * 24 * 365.25);
};

const handleSubmit = async () => {
  if (!dob) {
    setError("date of birth required.");
    return;
  }
  if (computeAge(dob) < 16) {
    setError("Mogster is for ages 16 and up. come back when you're cooking.");
    return;
  }
  if (!ageConfirmed) {
    setError("confirm you're 16+ to continue.");
    return;
  }
  // ...existing signup call, now also passing dob
  await signUp({ email, password, username, dob: dob.toISOString().slice(0, 10) });
};
```

### Step 4: Update authStore.signUp to persist DOB

In `app/src/store/authStore.ts`, find the signUp action. Add `dob: string` to its params, and when inserting/upserting into `profiles`, include `dob`:

```ts
await supabase.from("profiles").upsert({
  id: data.user.id,
  username,
  dob,           // NEW
  // ...rest
});
```

### Step 5: Typecheck + commit

```bash
cd /Users/grgurdamiani/Aurate/app && npx tsc --noEmit
git add app/app/auth/signup.tsx app/src/store/authStore.ts
git commit -m "feat(app): signup DOB picker + 16+ checkbox + ToS link"
```

---

## Task 10: App — Wire moderation rejection into home tab

**Files:**
- Modify: `app/src/lib/api.ts`
- Modify: `app/app/(tabs)/index.tsx`

### Step 1: Add typed `ModerationError` to api.ts

In `app/src/lib/api.ts`, add:

```ts
export class ModerationError extends Error {
  copyTier: "A" | "B" | "C";
  retryAllowed: boolean;
  hardLocked: boolean;
  retryAfter?: string;
  constructor(payload: any) {
    super("AURA_UNREADABLE");
    this.copyTier = payload.copy_tier ?? "A";
    this.retryAllowed = payload.retry_allowed === true;
    this.hardLocked = payload.hard_locked === true;
    this.retryAfter = payload.retry_after;
  }
}
```

In the `rateAura` (or whatever calls /aura/check) helper, when `res.status === 403` and the body has `error === "AURA_UNREADABLE"`, throw `new ModerationError(body)` instead of a generic Error.

### Step 2: Render `ModerationRejectCard` in home tab

In `app/app/(tabs)/index.tsx`, add state:

```ts
import { ModerationRejectCard } from "@/src/components/ModerationRejectCard";
import { ModerationError } from "@/src/lib/api";

const [modReject, setModReject] = useState<ModerationError | null>(null);
```

In the catch block of the photo-rating flow:

```ts
catch (e) {
  if (e instanceof ModerationError) {
    setModReject(e);
    return;
  }
  setError(getBrainrotError((e as Error).message));
}
```

In JSX, conditionally render:

```tsx
{modReject && (
  <ModerationRejectCard
    copyTier={modReject.copyTier}
    hardLocked={modReject.hardLocked}
    onRetry={() => setModReject(null)}
    onDismiss={() => setModReject(null)}
  />
)}
```

### Step 3: Typecheck + commit

```bash
cd /Users/grgurdamiani/Aurate/app && npx tsc --noEmit
git add app/src/lib/api.ts app/app/\(tabs\)/index.tsx
git commit -m "feat(app): render ModerationRejectCard on /aura/check 403"
```

---

## Task 11: End-to-end verification

### Step 1: Run all tests

```bash
cd /Users/grgurdamiani/Aurate/server && npm test
cd /Users/grgurdamiani/Aurate/server && npx tsc --noEmit
cd /Users/grgurdamiani/Aurate/app && npx tsc --noEmit
```
All clean / green.

### Step 2: Manual integration tests

Start the server locally:

```bash
cd /Users/grgurdamiani/Aurate/server && npm run dev
```

Test scenarios with `curl` (or Postman):

```bash
# 1. Safe adult selfie → 200 OK
curl -X POST http://localhost:3000/aura/check \
  -H "Authorization: Bearer $JWT" \
  -H "x-sigma-path: rizzmaxxing" \
  -F "file=@test/adult-selfie.jpg"

# 2. Explicit content (use a known NSFW test image — Gemini should SAFETY-block)
# Expected: {"error":"AURA_UNREADABLE","copy_tier":"A","retry_allowed":true}

# 3. Submit explicit 3 times → 3rd returns copy_tier=C with retry_after
# 4. Set UPDATE profiles SET moderation_override = true ... → strikes counter ignores
# 5. Submit safe selfie → 200 OK (override worked, normal path)
```

### Step 3: Verify DB rows

```sql
SELECT event_type, severity, attempt_number, created_at
FROM moderation_events
ORDER BY created_at DESC LIMIT 20;
```
Expect rows for each rejected request, correct event_type, incrementing attempt_number.

### Step 4: Verify Redis circuit breaker

Check the daily Gemini counter via Upstash dashboard:
```
Key: gemini:calls:YYYY-MM-DD
```
Confirm it incremented per call.

### Step 5: TestFlight build

```bash
cd /Users/grgurdamiani/Aurate/app
eas build --platform ios --profile production --auto-submit
```

### Step 6: TestFlight QA checklist

**Signup flow:**
- [ ] Try signup with DOB making user <16 → error: "Mogster is for ages 16 and up..."
- [ ] Try signup without checkbox → error: "confirm you're 16+ to continue"
- [ ] Try signup with DOB in the future → DOB picker prevents (maxDate set)
- [ ] Successful signup with valid DOB+checkbox → profile row has `dob` populated

**Moderation flow:**
- [ ] Submit adult selfie → score result renders (success path unchanged)
- [ ] Submit explicit content → ModerationRejectCard appears, TIER A copy
- [ ] Submit explicit 2 more times → TIER B then TIER C
- [ ] After TIER C, immediately try again → server still rejects (soft-lock)
- [ ] Set `UPDATE profiles SET moderation_override = true` for test user → strike counter ignores
- [ ] Force 5+ rejects in 7 days → next submission returns hard-lock card
- [ ] Tap "EMAIL SUPPORT" → opens mail to help@mogster.app

**Output blocklist:**
- [ ] Temporarily inject test term into `BLOCKLIST_BODY_FEATURE` → submit selfie that produces matching roast → server regenerates → response shows clean (or fallback) roast
- [ ] Inspect `moderation_events` table — rows with event_type=output_blocklist exist

### Step 7: Final commit + tag

```bash
git add docs/plans/2026-04-26-moderation-design.md docs/plans/2026-04-26-moderation-implementation.md
git commit -m "docs: moderation v1 design + implementation plan (v3 — Gemini-only)"
git tag w1-moderation-shipped
```

---

## Follow-ups (out of scope for this PR)

Capture as separate tasks/issues. Do NOT bloat W1:

- **Sightengine NSFW** — V2 if Gemini false-positive rate > 2%
- **Image-side age estimation** — V2 if telemetry shows under-16 leakage despite DOB
- **LLM-judge for output moderation** — V2 if blocklist proves insufficient
- **Slack/Discord webhook for circuit-breaker alerts**
- **Per-IP strikes for guest mode** — depends on W2 `/aura/rate-guest`
- **Image fingerprinting for repeat-offender detection**
- **In-app appeals UI** — only at >100K MAU
- **Per-region threshold tuning** (UK 13 vs DE 16)
- **Verifiable Parental Consent** — Year 2+

---

## Skill chain reminder

- This plan is the output of `superpowers:writing-plans`
- Execute via `superpowers:executing-plans` — task-by-task, with verification between
- Use `superpowers:test-driven-development` discipline on every TDD step
- Run `superpowers:verification-before-completion` before claiming "done" on any task
