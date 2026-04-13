# Aurate MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Aurate MVP — a social media app where users upload selfies, pick a Sigma Path, and get an AI-generated aura rating (score + roast + aura color) with friend/global leaderboards.

**Architecture:** React Native (Expo) mobile app talking to a Node.js/Fastify API backend. Supabase for auth, database, storage, and realtime. Redis (Upstash) for leaderboard caching. AI scoring via OpenAI GPT-4o Vision or Google Gemini Flash. AdMob for monetization.

**Tech Stack:** React Native (Expo SDK 52+), TypeScript, Fastify, Supabase (PostgreSQL + Auth + Storage + Realtime), Upstash Redis, OpenAI/Gemini Vision API, Google AdMob, Firebase Cloud Messaging

---

## Phase 1: Project Scaffolding & Infrastructure

### Task 1: Initialize Expo Project

**Files:**
- Create: `app/` (Expo project root)
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/app.json`

**Step 1: Create the Expo project**

```bash
cd /Users/grgurdamiani/Aurate
npx create-expo-app@latest app --template tabs
cd app
```

**Step 2: Install core dependencies**

```bash
npx expo install expo-image-picker expo-camera expo-sharing expo-notifications expo-font
npx expo install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens
npx expo install @supabase/supabase-js
npx expo install expo-linear-gradient
npm install zustand react-native-google-mobile-ads
```

**Step 3: Verify it runs**

```bash
npx expo start
```
Expected: Metro bundler starts, app loads on simulator/device.

**Step 4: Commit**

```bash
git init
git add -A
git commit -m "feat: initialize Expo project with core dependencies"
```

---

### Task 2: Initialize Fastify Backend

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts`
- Create: `server/.env.example`

**Step 1: Scaffold the backend**

```bash
cd /Users/grgurdamiani/Aurate
mkdir -p server/src
cd server
npm init -y
npm install fastify @fastify/cors @fastify/multipart @supabase/supabase-js ioredis openai dotenv
npm install -D typescript @types/node tsx
npx tsc --init --target ES2022 --module NodeNext --moduleResolution NodeNext --outDir dist --rootDir src --strict
```

**Step 2: Create the entry point**

Create `server/src/index.ts`:

```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();

const app = Fastify({ logger: true });

app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "cooking", aura: "immaculate" }));

const start = async () => {
  try {
    await app.listen({ port: Number(process.env.PORT) || 3000, host: "0.0.0.0" });
    console.log("Aurate API is live fr fr");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
```

**Step 3: Create .env.example**

```
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=your_openai_key
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token
```

**Step 4: Add dev script to package.json**

Add to `server/package.json` scripts:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Step 5: Run and verify**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/health
```
Expected: `{"status":"cooking","aura":"immaculate"}`

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: initialize Fastify backend with health check"
```

---

### Task 3: Set Up Supabase Project & Schema

**Files:**
- Create: `server/src/lib/supabase.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

**Step 1: Create Supabase project**

Go to supabase.com, create project "aurate". Save the URL and service key to `server/.env`.

Or use the Supabase MCP tool if available.

**Step 2: Write the migration SQL**

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Users table (extends Supabase Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  current_path TEXT DEFAULT 'auramaxxing',
  total_aura_points INTEGER DEFAULT 0,
  peak_aura INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_check_date DATE,
  tier TEXT DEFAULT 'Down Bad',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aura checks (each rating)
CREATE TABLE public.aura_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sigma_path TEXT NOT NULL,
  aura_score INTEGER NOT NULL CHECK (aura_score >= 0 AND aura_score <= 1000),
  personality_read TEXT NOT NULL,
  roast TEXT NOT NULL,
  aura_color JSONB NOT NULL, -- {primary: "#hex", secondary: "#hex", gradient_angle: 45}
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Daily vibe checks
CREATE TABLE public.daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  bonus_multiplier FLOAT DEFAULT 1.5,
  sigma_path TEXT, -- optional: locks to a specific path
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leaderboard queries
CREATE INDEX idx_profiles_total_aura ON public.profiles(total_aura_points DESC);
CREATE INDEX idx_profiles_peak_aura ON public.profiles(peak_aura DESC);
CREATE INDEX idx_aura_checks_user ON public.aura_checks(user_id, created_at DESC);
CREATE INDEX idx_aura_checks_path ON public.aura_checks(sigma_path, aura_score DESC);
CREATE INDEX idx_friendships_status ON public.friendships(addressee_id, status);

-- RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aura_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Aura checks: users can read all, insert own
CREATE POLICY "Aura checks are viewable by everyone" ON public.aura_checks FOR SELECT USING (true);
CREATE POLICY "Users can insert own checks" ON public.aura_checks FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Friendships: involved users can read, requester can insert
CREATE POLICY "Users can see own friendships" ON public.friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Addressee can update friendship status" ON public.friendships FOR UPDATE USING (auth.uid() = addressee_id);

-- Function to calculate tier from score
CREATE OR REPLACE FUNCTION get_tier(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN score >= 1000 THEN 'Skibidi Legendary'
    WHEN score >= 950 THEN 'Mog God'
    WHEN score >= 900 THEN 'Sigma'
    WHEN score >= 800 THEN 'HIM / HER'
    WHEN score >= 600 THEN 'Cooking'
    WHEN score >= 400 THEN '6-7'
    WHEN score >= 200 THEN 'NPC'
    ELSE 'Down Bad'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

**Step 3: Apply migration**

Run via Supabase dashboard SQL editor or CLI:
```bash
supabase db push
```

**Step 4: Create Supabase client lib**

Create `server/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);
```

**Step 5: Commit**

```bash
git add supabase/ server/src/lib/
git commit -m "feat: add database schema with profiles, aura checks, friendships"
```

---

### Task 4: Set Up Upstash Redis

**Files:**
- Create: `server/src/lib/redis.ts`

**Step 1: Create Redis client**

Create `server/src/lib/redis.ts`:

```typescript
import Redis from "ioredis";

export const redis = new Redis(process.env.UPSTASH_REDIS_URL!, {
  tls: { rejectUnauthorized: false },
});

// Leaderboard keys
export const LEADERBOARD_KEYS = {
  global: "leaderboard:global",
  path: (path: string) => `leaderboard:path:${path}`,
  friends: (userId: string) => `leaderboard:friends:${userId}`,
} as const;
```

**Step 2: Commit**

```bash
git add server/src/lib/redis.ts
git commit -m "feat: add Redis client for leaderboard caching"
```

---

## Phase 2: AI Aura Rating Engine

### Task 5: Build AI Prompt System

**Files:**
- Create: `server/src/ai/prompts.ts`
- Create: `server/src/ai/types.ts`

**Step 1: Define types**

Create `server/src/ai/types.ts`:

```typescript
export type SigmaPath =
  | "auramaxxing"
  | "looksmaxxing"
  | "mogger_mode"
  | "rizzmaxxing"
  | "statusmaxxing"
  | "brainrot_mode"
  | "sigma_grindset";

export interface AuraResult {
  aura_score: number;       // 0-1000
  personality_read: string; // 2-3 sentences
  roast: string;            // shareable one-liner
  aura_color: {
    primary: string;        // hex
    secondary: string;      // hex
    gradient_angle: number; // degrees
  };
  tier: string;
}

export const SIGMA_PATHS: Record<SigmaPath, { label: string; description: string }> = {
  auramaxxing: {
    label: "Auramaxxing",
    description: "Main character energy check. Are you HIM or are you mid?",
  },
  looksmaxxing: {
    label: "Looksmaxxing",
    description: "Softmaxx or hardmaxx, we rate the whole glow-up no cap",
  },
  mogger_mode: {
    label: "Mogger Mode",
    description: "Are you mogging the room or getting mogged? Let's find out",
  },
  rizzmaxxing: {
    label: "Rizzmaxxing",
    description: "Unspoken rizz or no rizz detected? The AI knows.",
  },
  statusmaxxing: {
    label: "Statusmaxxing",
    description: "How hard are you flexing rn? Drip check activated",
  },
  brainrot_mode: {
    label: "Brainrot Mode",
    description: "Full goblin mode. Ohio energy. Skibidi toilet arc. No thoughts.",
  },
  sigma_grindset: {
    label: "Sigma Grindset",
    description: "Are you on your sigma grindset or are you just an NPC?",
  },
};
```

**Step 2: Create prompt system**

Create `server/src/ai/prompts.ts`:

```typescript
import { SigmaPath } from "./types";

const BASE_PROMPT = `You are the Aurate AI — the ultimate aura rater. You speak fluent Gen Z / Gen Alpha brainrot.

You will receive a selfie/photo of a person. Analyze it and return a JSON response.

TONE RULES:
- Speak like a brainrot-fluent friend roasting/hyping someone
- Use terms like: no cap, fr fr, ngl, deadass, W, L, cooking, mid, NPC, sigma, mogging, Ohio energy, 6-7, slay, ate, understood the assignment
- Be funny and edgy but NEVER mean-spirited about identity (race, ethnicity, body weight, disability, gender)
- Focus on: outfit, style, energy, vibe, confidence, setting, pose, expression
- High scores get hype. Low scores get roasted (playfully). Mid scores get "6-7 at best" energy.

AURA COLOR: Pick two hex colors that match the vibe. Warm/golden for high aura. Gray/dark for low. Chaotic colors for brainrot mode.

SCORING: Be honest. Not everyone is a 900. Most people are 400-700. Reserve 800+ for genuinely impressive vibes. Under 300 is for truly cursed energy.

TIER MAPPING:
- 0-199: Down Bad
- 200-399: NPC
- 400-599: 6-7
- 600-799: Cooking
- 800-899: HIM / HER
- 900-949: Sigma
- 950-999: Mog God
- 1000: Skibidi Legendary (almost never give this)

Return ONLY valid JSON:
{
  "aura_score": <number 0-1000>,
  "personality_read": "<2-3 sentences analyzing their vibe/energy in brainrot language>",
  "roast": "<one shareable one-liner roast or compliment>",
  "aura_color": {"primary": "<hex>", "secondary": "<hex>", "gradient_angle": <number>},
  "tier": "<tier name from mapping above>"
}`;

const PATH_OVERLAYS: Record<SigmaPath, string> = {
  auramaxxing: `
SCORING FOCUS: Overall energy, confidence, presence, fit, vibe.
Judge the WHOLE picture — outfit, pose, background, expression, energy they radiate.
This is the default balanced path.`,

  looksmaxxing: `
SCORING FOCUS: Style, grooming, fashion choices, glow-up potential.
Rate their outfit coordination, hair, skincare game, accessory choices.
Are they softmaxxing or hardmaxxing? Rate the drip specifically.`,

  mogger_mode: `
SCORING FOCUS: How hard they outshine / dominate the frame.
Are they mogging everyone? Is the mog differential insane?
Judge presence, jawline energy, posture, dominance in the photo.
Use "mogging" and "mog differential" language heavily.`,

  rizzmaxxing: `
SCORING FOCUS: Charisma, charm, flirt energy, approachability.
Do they have unspoken rizz? Would they cook in a conversation?
Judge smile, eye contact, confidence, "main character at the party" energy.`,

  statusmaxxing: `
SCORING FOCUS: Flex level, luxury signals, expensive vibes.
Rate the drip cost, background flex (car, location, food), watch game.
How hard are they flexing? Is it giving rich or giving "pretending to be rich"?`,

  brainrot_mode: `
SCORING FOCUS: How chaotic, unhinged, and meme-worthy the photo is.
The MORE cursed and absurd, the HIGHER the score. Normal photos score LOW here.
Ohio energy = high score. Skibidi toilet arc = peak score.
Goblin mode, NPC behavior caught in 4K, pure chaos = W.
This path INVERTS normal scoring. Weird is good. Normal is mid.`,

  sigma_grindset: `
SCORING FOCUS: Discipline, grind energy, lone wolf vibes.
Are they on their sigma grindset? Gym pic? Study grind? Work setup?
Judge focus, determination, "I don't need validation" energy.
Patrick Bateman morning routine vibes = high score.`,
};

export function buildPrompt(path: SigmaPath): string {
  return `${BASE_PROMPT}\n\nSIGMA PATH: ${path.toUpperCase()}\n${PATH_OVERLAYS[path]}`;
}
```

**Step 3: Commit**

```bash
git add server/src/ai/
git commit -m "feat: add AI prompt system with 7 Sigma Paths"
```

---

### Task 6: Build AI Rating Service

**Files:**
- Create: `server/src/ai/rate.ts`
- Test: `server/src/ai/__tests__/rate.test.ts`

**Step 1: Write the rating service**

Create `server/src/ai/rate.ts`:

```typescript
import OpenAI from "openai";
import { buildPrompt } from "./prompts";
import { AuraResult, SigmaPath } from "./types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function rateAura(
  imageBase64: string,
  path: SigmaPath
): Promise<AuraResult> {
  const systemPrompt = buildPrompt(path);

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
              detail: "low",
            },
          },
          {
            type: "text",
            text: "Rate this person's aura. Return ONLY the JSON.",
          },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.9, // high creativity for roasts
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned empty response — aura too powerful to compute fr");

  const result: AuraResult = JSON.parse(raw);

  // Clamp score to valid range
  result.aura_score = Math.max(0, Math.min(1000, Math.round(result.aura_score)));

  return result;
}
```

**Step 2: Commit**

```bash
git add server/src/ai/rate.ts
git commit -m "feat: add AI aura rating service with GPT-4o Vision"
```

---

## Phase 3: API Routes

### Task 7: Auth Routes

**Files:**
- Create: `server/src/routes/auth.ts`

**Step 1: Create auth routes**

Create `server/src/routes/auth.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";

export async function authRoutes(app: FastifyInstance) {
  // Sign up
  app.post("/auth/signup", async (request, reply) => {
    const { email, password, username, display_name } = request.body as {
      email: string;
      password: string;
      username: string;
      display_name?: string;
    };

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return reply.status(400).send({ error: authError.message });
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      username,
      display_name: display_name || username,
    });

    if (profileError) {
      return reply.status(400).send({ error: profileError.message });
    }

    return { message: "Account created. Your aura origin story begins now.", user_id: authData.user.id };
  });

  // Sign in
  app.post("/auth/signin", async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return reply.status(401).send({ error: "L. Wrong credentials detected." });
    }

    return { session: data.session, user: data.user };
  });
}
```

**Step 2: Register routes in index.ts**

Add to `server/src/index.ts`:
```typescript
import { authRoutes } from "./routes/auth";
app.register(authRoutes);
```

**Step 3: Commit**

```bash
git add server/src/routes/auth.ts server/src/index.ts
git commit -m "feat: add auth routes (signup + signin)"
```

---

### Task 8: Aura Check Route (Core Feature)

**Files:**
- Create: `server/src/routes/aura.ts`
- Modify: `server/src/index.ts`

**Step 1: Create the aura check route**

Create `server/src/routes/aura.ts`:

```typescript
import { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { supabase } from "../lib/supabase";
import { redis, LEADERBOARD_KEYS } from "../lib/redis";
import { rateAura } from "../ai/rate";
import { SigmaPath, SIGMA_PATHS } from "../ai/types";

export async function auraRoutes(app: FastifyInstance) {
  app.register(multipart, { limits: { fileSize: 10_000_000 } }); // 10MB

  // Drop a Pic — the core aura check
  app.post("/aura/check", async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.status(400).send({ error: "No pic detected. Drop a pic fr" });

    const userId = (request.headers["x-user-id"] as string); // TODO: replace with JWT auth middleware
    const sigmaPath = (request.headers["x-sigma-path"] as SigmaPath) || "auramaxxing";

    if (!SIGMA_PATHS[sigmaPath]) {
      return reply.status(400).send({ error: "Invalid sigma path. That's not a real archetype ngl" });
    }

    // Check daily limit (3 free checks)
    const today = new Date().toISOString().split("T")[0];
    const checkCount = await redis.get(`checks:${userId}:${today}`);
    if (Number(checkCount) >= 3) {
      return reply.status(429).send({
        error: "Daily limit hit. Watch an ad to unlock more checks or wait till tomorrow.",
        checks_remaining: 0,
      });
    }

    // Read image as base64
    const buffer = await data.toBuffer();
    const imageBase64 = buffer.toString("base64");

    // Upload image to Supabase Storage
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("aura-pics")
      .upload(fileName, buffer, { contentType: "image/jpeg" });

    if (uploadError) {
      return reply.status(500).send({ error: "Failed to upload pic. The servers are cooked rn" });
    }

    const { data: urlData } = supabase.storage.from("aura-pics").getPublicUrl(fileName);

    // AI Rating
    const result = await rateAura(imageBase64, sigmaPath);

    // Save to database
    const { data: check, error: dbError } = await supabase
      .from("aura_checks")
      .insert({
        user_id: userId,
        image_url: urlData.publicUrl,
        sigma_path: sigmaPath,
        aura_score: result.aura_score,
        personality_read: result.personality_read,
        roast: result.roast,
        aura_color: result.aura_color,
        tier: result.tier,
      })
      .select()
      .single();

    if (dbError) {
      return reply.status(500).send({ error: "DB crashed out. Try again." });
    }

    // Update leaderboards in Redis
    await redis.zadd(LEADERBOARD_KEYS.global, result.aura_score, userId);
    await redis.zadd(LEADERBOARD_KEYS.path(sigmaPath), result.aura_score, userId);

    // Update profile stats
    await supabase.rpc("update_profile_stats", {
      p_user_id: userId,
      p_score: result.aura_score,
      p_tier: result.tier,
    });

    // Increment daily check count
    await redis.incr(`checks:${userId}:${today}`);
    await redis.expire(`checks:${userId}:${today}`, 86400);

    return {
      ...result,
      check_id: check.id,
      image_url: urlData.publicUrl,
      checks_remaining: 3 - (Number(checkCount) + 1),
    };
  });

  // Get user's aura history
  app.get("/aura/history/:userId", async (request) => {
    const { userId } = request.params as { userId: string };
    const { data } = await supabase
      .from("aura_checks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return { checks: data || [] };
  });
}
```

**Step 2: Create the profile stats RPC function**

Add to migrations:

```sql
CREATE OR REPLACE FUNCTION update_profile_stats(
  p_user_id UUID,
  p_score INTEGER,
  p_tier TEXT
)
RETURNS VOID AS $$
DECLARE
  v_last_check DATE;
  v_current_streak INTEGER;
BEGIN
  SELECT last_check_date, current_streak INTO v_last_check, v_current_streak
  FROM profiles WHERE id = p_user_id;

  UPDATE profiles SET
    total_aura_points = total_aura_points + p_score,
    peak_aura = GREATEST(peak_aura, p_score),
    tier = CASE WHEN p_score > peak_aura THEN p_tier ELSE tier END,
    current_streak = CASE
      WHEN v_last_check = CURRENT_DATE - INTERVAL '1 day' THEN v_current_streak + 1
      WHEN v_last_check = CURRENT_DATE THEN v_current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(longest_streak, CASE
      WHEN v_last_check = CURRENT_DATE - INTERVAL '1 day' THEN v_current_streak + 1
      ELSE 1
    END),
    last_check_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
```

**Step 3: Register routes**

Add to `server/src/index.ts`:
```typescript
import { auraRoutes } from "./routes/aura";
app.register(auraRoutes);
```

**Step 4: Commit**

```bash
git add server/src/routes/aura.ts supabase/
git commit -m "feat: add core aura check route with AI rating, storage, leaderboard"
```

---

### Task 9: Mog Board (Leaderboard) Routes

**Files:**
- Create: `server/src/routes/leaderboard.ts`

**Step 1: Create leaderboard routes**

Create `server/src/routes/leaderboard.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { redis, LEADERBOARD_KEYS } from "../lib/redis";
import { supabase } from "../lib/supabase";

export async function leaderboardRoutes(app: FastifyInstance) {
  // Global Mog Board
  app.get("/mogboard/global", async (request) => {
    const { limit = "50", offset = "0" } = request.query as { limit?: string; offset?: string };

    const userIds = await redis.zrevrange(
      LEADERBOARD_KEYS.global,
      Number(offset),
      Number(offset) + Number(limit) - 1,
      "WITHSCORES"
    );

    // Pair up [userId, score, userId, score, ...]
    const entries = [];
    for (let i = 0; i < userIds.length; i += 2) {
      entries.push({ user_id: userIds[i], peak_aura: Number(userIds[i + 1]) });
    }

    // Fetch profiles for these users
    if (entries.length === 0) return { leaderboard: [] };

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, tier, current_streak")
      .in("id", entries.map((e) => e.user_id));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return {
      leaderboard: entries.map((e, i) => ({
        rank: Number(offset) + i + 1,
        ...profileMap.get(e.user_id),
        peak_aura: e.peak_aura,
      })),
    };
  });

  // Path-specific Mog Board
  app.get("/mogboard/path/:path", async (request) => {
    const { path } = request.params as { path: string };
    const { limit = "50" } = request.query as { limit?: string };

    const userIds = await redis.zrevrange(
      LEADERBOARD_KEYS.path(path),
      0,
      Number(limit) - 1,
      "WITHSCORES"
    );

    const entries = [];
    for (let i = 0; i < userIds.length; i += 2) {
      entries.push({ user_id: userIds[i], score: Number(userIds[i + 1]) });
    }

    if (entries.length === 0) return { leaderboard: [] };

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, tier")
      .in("id", entries.map((e) => e.user_id));

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return {
      leaderboard: entries.map((e, i) => ({
        rank: i + 1,
        ...profileMap.get(e.user_id),
        score: e.score,
      })),
    };
  });

  // Friends Mog Board
  app.get("/mogboard/circle/:userId", async (request) => {
    const { userId } = request.params as { userId: string };

    // Get accepted friends
    const { data: friendships } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    const friendIds = (friendships || []).map((f) =>
      f.requester_id === userId ? f.addressee_id : f.requester_id
    );
    friendIds.push(userId); // include self

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, peak_aura, tier, current_streak")
      .in("id", friendIds)
      .order("peak_aura", { ascending: false });

    return {
      leaderboard: (profiles || []).map((p, i) => ({ rank: i + 1, ...p })),
    };
  });
}
```

**Step 2: Register and commit**

```bash
git add server/src/routes/leaderboard.ts
git commit -m "feat: add Mog Board routes (global, path, friends)"
```

---

### Task 10: Friends (Your Circle) Routes

**Files:**
- Create: `server/src/routes/friends.ts`

**Step 1: Create friend routes**

Create `server/src/routes/friends.ts`:

```typescript
import { FastifyInstance } from "fastify";
import { supabase } from "../lib/supabase";

export async function friendRoutes(app: FastifyInstance) {
  // Link Up (send friend request)
  app.post("/circle/link", async (request, reply) => {
    const { requester_id, addressee_username } = request.body as {
      requester_id: string;
      addressee_username: string;
    };

    const { data: addressee } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", addressee_username)
      .single();

    if (!addressee) {
      return reply.status(404).send({ error: "User not found. That username doesn't exist fr" });
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id,
      addressee_id: addressee.id,
    });

    if (error) {
      return reply.status(400).send({ error: "Already in your circle or request pending" });
    }

    return { message: "Link up request sent. W." };
  });

  // Accept / reject
  app.patch("/circle/respond", async (request, reply) => {
    const { friendship_id, action } = request.body as {
      friendship_id: string;
      action: "accepted" | "blocked";
    };

    const { error } = await supabase
      .from("friendships")
      .update({ status: action })
      .eq("id", friendship_id);

    if (error) return reply.status(400).send({ error: "Failed to update. Try again." });

    return { message: action === "accepted" ? "Linked up. W secured." : "Blocked. They can't see your aura anymore." };
  });

  // Get your circle
  app.get("/circle/:userId", async (request) => {
    const { userId } = request.params as { userId: string };

    const { data } = await supabase
      .from("friendships")
      .select(`
        id,
        status,
        requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url, peak_aura, tier),
        addressee:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url, peak_aura, tier)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq("status", "accepted");

    const friends = (data || []).map((f: any) => {
      const friend = f.requester.id === userId ? f.addressee : f.requester;
      return { friendship_id: f.id, ...friend };
    });

    return { circle: friends };
  });

  // Pending requests
  app.get("/circle/pending/:userId", async (request) => {
    const { userId } = request.params as { userId: string };

    const { data } = await supabase
      .from("friendships")
      .select(`
        id,
        requester:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)
      `)
      .eq("addressee_id", userId)
      .eq("status", "pending");

    return { pending: data || [] };
  });
}
```

**Step 2: Register and commit**

```bash
git add server/src/routes/friends.ts
git commit -m "feat: add Your Circle routes (link up, respond, list friends)"
```

---

## Phase 4: Mobile App (React Native)

### Task 11: App Theme, Constants & Navigation

**Files:**
- Create: `app/src/constants/theme.ts`
- Create: `app/src/constants/paths.ts`
- Create: `app/src/constants/tiers.ts`
- Modify: `app/app/(tabs)/_layout.tsx`

**Step 1: Create theme constants**

Create `app/src/constants/theme.ts`:

```typescript
export const COLORS = {
  bg: "#0A0A0F",
  bgCard: "#141420",
  bgElevated: "#1E1E2E",
  primary: "#8B5CF6",    // purple aura
  secondary: "#F59E0B",  // golden aura
  accent: "#EC4899",     // pink
  textPrimary: "#FFFFFF",
  textSecondary: "#A1A1AA",
  textMuted: "#52525B",
  success: "#22C55E",    // W green
  danger: "#EF4444",     // L red
  warning: "#F59E0B",
  border: "#27272A",
};

export const FONTS = {
  bold: "SpaceMono-Bold",
  regular: "SpaceMono-Regular",
  // TODO: replace with custom brand font
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

**Step 2: Create path constants**

Create `app/src/constants/paths.ts`:

```typescript
export const SIGMA_PATHS = [
  { id: "auramaxxing", label: "Auramaxxing", emoji: "✨", description: "Main character energy check. Are you HIM or are you mid?" },
  { id: "looksmaxxing", label: "Looksmaxxing", emoji: "💅", description: "Softmaxx or hardmaxx, we rate the whole glow-up no cap" },
  { id: "mogger_mode", label: "Mogger Mode", emoji: "👑", description: "Are you mogging the room or getting mogged? Let's find out" },
  { id: "rizzmaxxing", label: "Rizzmaxxing", emoji: "😏", description: "Unspoken rizz or no rizz detected? The AI knows." },
  { id: "statusmaxxing", label: "Statusmaxxing", emoji: "💰", description: "How hard are you flexing rn? Drip check activated" },
  { id: "brainrot_mode", label: "Brainrot Mode", emoji: "🧠", description: "Full goblin mode. Ohio energy. Skibidi toilet arc. No thoughts." },
  { id: "sigma_grindset", label: "Sigma Grindset", emoji: "🐺", description: "Are you on your sigma grindset or are you just an NPC?" },
] as const;
```

**Step 3: Create tier constants**

Create `app/src/constants/tiers.ts`:

```typescript
export const TIERS = [
  { name: "Down Bad", min: 0, max: 199, color: "#374151" },
  { name: "NPC", min: 200, max: 399, color: "#6B7280" },
  { name: "6-7", min: 400, max: 599, color: "#D97706" },
  { name: "Cooking", min: 600, max: 799, color: "#F59E0B" },
  { name: "HIM / HER", min: 800, max: 899, color: "#8B5CF6" },
  { name: "Sigma", min: 900, max: 949, color: "#F59E0B" },
  { name: "Mog God", min: 950, max: 999, color: "#EC4899" },
  { name: "Skibidi Legendary", min: 1000, max: 1000, color: "#10B981" },
] as const;

export function getTierForScore(score: number) {
  return TIERS.find((t) => score >= t.min && score <= t.max) || TIERS[0];
}
```

**Step 4: Set up tab navigation**

Update `app/app/(tabs)/_layout.tsx` with 4 tabs:
- **Vibe Check** (camera icon) — Drop a Pic screen
- **Mog Board** (trophy icon) — Leaderboards
- **Your Aura** (user icon) — Profile + history
- **Circle** (people icon) — Friends

**Step 5: Commit**

```bash
git add app/src/constants/ app/app/
git commit -m "feat: add app theme, sigma paths, tiers, tab navigation"
```

---

### Task 12: Supabase Client & Auth Store

**Files:**
- Create: `app/src/lib/supabase.ts`
- Create: `app/src/store/authStore.ts`

**Step 1: Create Supabase client**

Create `app/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
```

**Step 2: Create auth store with Zustand**

Create `app/src/store/authStore.ts`:

```typescript
import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  current_path: string;
  total_aura_points: number;
  peak_aura: number;
  current_streak: number;
  tier: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setPath: (path: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        display_name: username,
      });
      set({ user: data.user });
      await get().fetchProfile();
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
    await get().fetchProfile();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    set({ user, profile: data, loading: false });
  },

  setPath: (path) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, current_path: path } : null,
    }));
  },
}));
```

**Step 3: Commit**

```bash
git add app/src/lib/ app/src/store/
git commit -m "feat: add Supabase client and Zustand auth store"
```

---

### Task 13: Drop a Pic Screen (Core Feature)

**Files:**
- Create: `app/app/(tabs)/vibe-check.tsx`
- Create: `app/src/components/PathSelector.tsx`
- Create: `app/src/components/AuraResultCard.tsx`

**Step 1: Build the path selector component**

Create `app/src/components/PathSelector.tsx` — horizontal scrolling list of the 7 Sigma Paths with emoji + label. Selected path is highlighted with the primary color.

**Step 2: Build the aura result card component**

Create `app/src/components/AuraResultCard.tsx` — displays the AI result with:
- Gradient background using aura_color
- Score in large bold text
- Tier badge
- Personality read text
- Roast as a highlighted quote
- "Post the W" share button

**Step 3: Build the main vibe check screen**

Create `app/app/(tabs)/vibe-check.tsx` — the core screen:
1. PathSelector at top
2. Large "Drop a Pic" button (opens image picker)
3. After upload: loading animation ("Checking your aura fr fr...")
4. Result: AuraResultCard slides up
5. Share button generates shareable card image

**Step 4: Commit**

```bash
git add app/app/(tabs)/vibe-check.tsx app/src/components/
git commit -m "feat: add Drop a Pic screen with path selector and result card"
```

---

### Task 14: Mog Board Screen

**Files:**
- Create: `app/app/(tabs)/mogboard.tsx`
- Create: `app/src/components/LeaderboardRow.tsx`

**Step 1: Build leaderboard row component**

Shows rank number, avatar, username, peak aura score, tier badge. Top 3 get special styling (gold/silver/bronze).

**Step 2: Build Mog Board screen**

Three tabs at top: **Global** | **Path** (dropdown to pick path) | **Your Circle**

Each tab fetches from the corresponding API endpoint and renders a scrollable list of LeaderboardRow components.

**Step 3: Commit**

```bash
git add app/app/(tabs)/mogboard.tsx app/src/components/LeaderboardRow.tsx
git commit -m "feat: add Mog Board screen with global, path, and friends tabs"
```

---

### Task 15: Your Aura (Profile) Screen

**Files:**
- Create: `app/app/(tabs)/your-aura.tsx`
- Create: `app/src/components/AuraHistoryItem.tsx`
- Create: `app/src/components/StatsBar.tsx`

**Step 1: Build profile screen**

Shows:
- Avatar + username + tier badge
- Stats bar: Peak Aura | Current Streak | Total W's
- Sigma Path selector (to change default)
- Scrollable history of past aura checks (thumbnail + score + roast preview)

**Step 2: Commit**

```bash
git add app/app/(tabs)/your-aura.tsx app/src/components/
git commit -m "feat: add Your Aura profile screen with history"
```

---

### Task 16: Your Circle (Friends) Screen

**Files:**
- Create: `app/app/(tabs)/circle.tsx`

**Step 1: Build friends screen**

Shows:
- Search bar to find users by username
- "Link Up" button to send friend request
- Pending requests section (accept/block)
- Friends list with their latest score + tier

**Step 2: Commit**

```bash
git add app/app/(tabs)/circle.tsx
git commit -m "feat: add Your Circle friends screen"
```

---

## Phase 5: Engagement Features

### Task 17: Daily Vibe Check

**Files:**
- Create: `server/src/routes/daily.ts`
- Create: `app/src/components/DailyChallengeBanner.tsx`

**Step 1: Create daily challenge route**

Endpoint that returns today's challenge. If no challenge exists for today, auto-generate one (rotate through themes like "Mogger Monday", "Rizz Wednesday", "Sigma Sunday").

**Step 2: Create banner component**

Shows at top of Vibe Check screen. Displays challenge title + bonus multiplier. Tapping it pre-selects the challenge's sigma path.

**Step 3: Commit**

```bash
git add server/src/routes/daily.ts app/src/components/DailyChallengeBanner.tsx
git commit -m "feat: add Daily Vibe Check with challenge rotation"
```

---

### Task 18: Streaks

**Files:**
- Modify: `server/src/routes/aura.ts` (streak logic already in profile stats RPC)
- Create: `app/src/components/StreakCounter.tsx`

**Step 1: Build streak counter component**

Flame icon with streak count. Animates on streak increase. Shows "Streak: 🔥 7" format. Warning state when streak is about to break (hasn't checked today).

**Step 2: Commit**

```bash
git add app/src/components/StreakCounter.tsx
git commit -m "feat: add streak counter component with flame animation"
```

---

### Task 19: Share Cards

**Files:**
- Create: `app/src/utils/shareCard.ts`
- Create: `app/src/components/ShareableCard.tsx`

**Step 1: Build shareable card generator**

Takes an AuraResult and generates a visually appealing card image:
- Gradient background (aura colors)
- Score in large text
- Roast quote
- Tier badge
- "Aurate" watermark + app store link QR
- Optimized for Instagram Story (9:16) and TikTok

Uses `react-native-view-shot` to capture the card as an image, then `expo-sharing` to share it.

**Step 2: Commit**

```bash
git add app/src/utils/shareCard.ts app/src/components/ShareableCard.tsx
git commit -m "feat: add shareable aura card generator for TikTok/IG"
```

---

## Phase 6: Push Notifications & Ads

### Task 20: Push Notifications (Aura Alerts)

**Files:**
- Create: `app/src/lib/notifications.ts`
- Create: `server/src/services/notifications.ts`

**Step 1: Set up Expo push notifications**

Register for push token on app launch, save to profile. Server sends notifications for:
- Friend beat your high score
- Daily Vibe Check is live
- Streak about to expire
- Friend request received

**Step 2: Commit**

```bash
git add app/src/lib/notifications.ts server/src/services/notifications.ts
git commit -m "feat: add push notifications for Aura Alerts"
```

---

### Task 21: Ad Integration (AdMob)

**Files:**
- Create: `app/src/lib/ads.ts`
- Create: `app/src/components/RewardedAdButton.tsx`

**Step 1: Set up AdMob**

Configure `react-native-google-mobile-ads`:
- Rewarded video ads: shown when user hits daily limit, grants 1 extra check
- Native ads: shown in Timeline/Mog Board feed (between rows)

**Step 2: Build rewarded ad button**

"Watch ad for +1 check" button. Shows rewarded video, on completion calls API to increment check limit.

**Step 3: Commit**

```bash
git add app/src/lib/ads.ts app/src/components/RewardedAdButton.tsx
git commit -m "feat: add AdMob integration with rewarded video for extra checks"
```

---

## Phase 7: Auth Screens & Onboarding

### Task 22: Auth Screens

**Files:**
- Create: `app/app/auth/signin.tsx`
- Create: `app/app/auth/signup.tsx`

**Step 1: Build sign in / sign up screens**

Dark theme, brainrot copy:
- Sign up: "Begin your Aura Origin Story"
- Sign in: "Welcome back. Your aura awaits."
- Username picker on signup
- Email + password (keep it simple for MVP)

**Step 2: Commit**

```bash
git add app/app/auth/
git commit -m "feat: add auth screens with brainrot onboarding copy"
```

---

### Task 23: Onboarding Flow (Aura Origin Story)

**Files:**
- Create: `app/app/onboarding/index.tsx`

**Step 1: Build onboarding**

3-screen swiper:
1. "Welcome to Aurate" — "The AI rates your aura. Are you HIM or are you mid?"
2. "Pick your Sigma Path" — path selector, explain what each does
3. "Drop your first pic" — camera/gallery prompt

After onboarding → redirect to main tabs.

**Step 2: Commit**

```bash
git add app/app/onboarding/
git commit -m "feat: add Aura Origin Story onboarding flow"
```

---

## Phase 8: Polish & Launch Prep

### Task 24: Content Moderation Layer

**Files:**
- Create: `server/src/middleware/moderation.ts`

**Step 1: Add image moderation**

Before sending to AI, run image through OpenAI moderation endpoint or a lightweight NSFW classifier. Reject inappropriate images with brainrot error message: "That pic is NOT it. Try again with something that doesn't violate the vibe code."

**Step 2: Add output moderation**

After AI response, check for slurs, hate speech, or discriminatory content. Re-generate if flagged.

**Step 3: Commit**

```bash
git add server/src/middleware/moderation.ts
git commit -m "feat: add content moderation for images and AI output"
```

---

### Task 25: Error Handling & Loading States

**Files:**
- Create: `app/src/components/LoadingAura.tsx`
- Create: `app/src/components/ErrorState.tsx`

**Step 1: Build loading component**

Animated aura pulsing effect with rotating brainrot loading messages:
- "Analyzing your aura fr fr..."
- "Computing the mog differential..."
- "Checking if you're HIM..."
- "The AI is cooking rn..."

**Step 2: Build error state component**

Brainrot error messages:
- Network error: "The servers crashed out. L."
- Rate limit: "Daily limit hit. Watch an ad or come back tomorrow."
- Generic: "Something went wrong ngl. Try again."

**Step 3: Commit**

```bash
git add app/src/components/LoadingAura.tsx app/src/components/ErrorState.tsx
git commit -m "feat: add brainrot loading and error state components"
```

---

### Task 26: App Store Assets & Metadata

**Files:**
- Create: `docs/app-store-listing.md`

**Step 1: Write app store listing**

- **App Name:** Aurate — AI Aura Check
- **Subtitle:** Are you HIM or are you mid?
- **Keywords:** aura, aura check, aura points, vibe check, rate my aura, auramaxxing, mogging, sigma
- **Description:** Drop a pic. Pick your sigma path. Let the AI rate your aura. Compete with friends on The Mog Board. Daily Vibe Checks. Streaks. 7 different ways to be rated. Free, no cap.
- **Category:** Social Networking
- **Age Rating:** 12+ (infrequent mild language)

**Step 2: Commit**

```bash
git add docs/app-store-listing.md
git commit -m "docs: add app store listing copy"
```

---

## Task Dependency Map

```
Phase 1 (Scaffolding):    T1 → T2 → T3 → T4
Phase 2 (AI Engine):      T5 → T6
Phase 3 (API Routes):     T7 → T8 → T9 → T10
Phase 4 (Mobile App):     T11 → T12 → T13 → T14 → T15 → T16
Phase 5 (Engagement):     T17 → T18 → T19
Phase 6 (Notifs & Ads):   T20 → T21
Phase 7 (Auth & Onboard): T22 → T23
Phase 8 (Polish):         T24 → T25 → T26

Parallelizable:
- Phase 1 + Phase 2 can run in parallel
- Phase 3 depends on Phase 1 + 2
- Phase 4 depends on Phase 1 (app scaffold)
- Phase 5-8 depend on Phase 3 + 4
```

---

## Estimated Timeline

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| Phase 1: Scaffolding | T1-T4 | 1 day |
| Phase 2: AI Engine | T5-T6 | 0.5 day |
| Phase 3: API Routes | T7-T10 | 1.5 days |
| Phase 4: Mobile App | T11-T16 | 3 days |
| Phase 5: Engagement | T17-T19 | 1 day |
| Phase 6: Notifs & Ads | T20-T21 | 1 day |
| Phase 7: Auth & Onboard | T22-T23 | 0.5 day |
| Phase 8: Polish | T24-T26 | 1 day |
| **Total** | **26 tasks** | **~9.5 days** |
