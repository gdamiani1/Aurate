# Moderation v1 — Design Doc

**Date:** 2026-04-26 (v1+v2), revised 2026-04-27 (v3 — current)
**Status:** Approved, ready for implementation plan
**Workstream:** W1 of pre-launch development plan
**Author:** Grgur + Claude (brainstorming session, three revisions)

---

## Revision history

| Version | Date | Architecture | Why superseded |
|---|---|---|---|
| v1 | 2026-04-26 | Sightengine NSFW + Sightengine age + blocklist + 3-strike | Image-side age estimation = 3-5% UX-killing false-positive rate; self-attestation is the category norm |
| v2 | 2026-04-26 | Sightengine NSFW + DOB attestation + blocklist + 3-strike | Sightengine for NSFW = needless vendor; Gemini's safety filter already does this |
| **v3** | **2026-04-27** | **Gemini built-in safety + DOB attestation + blocklist + 3-strike** | **Current — v0 of moderation, ready to ship** |

The pattern in revisions: each cut removed an unnecessary defense layer that was importing FAANG-scale moderation thinking into a solo-founder pre-launch context. See [Memory/preferences/preferences-engineering-defaults.md](../../Memory/preferences/preferences-engineering-defaults.md) for the broader principle.

---

## Why this exists

[server/src/middleware/moderation.ts](../../server/src/middleware/moderation.ts) is a 14-line stub. `moderateImage()` returns `{safe: true}` unconditionally, the output blocklist is `[]`, and **the file is never imported into [server/src/routes/aura.ts](../../server/src/routes/aura.ts)**. The current rate handler at [server/src/ai/rate.ts:25-33](../../server/src/ai/rate.ts:25) calls Gemini without explicit `safetySettings`, so blocking relies entirely on Gemini's defaults — and crucially, **the route doesn't catch a `SAFETY` finishReason gracefully** (calling `.text()` on a SAFETY-blocked response throws).

Three real launch risks:
1. NSFW imagery — clearly mitigable
2. Photos of minors — primary App Store risk in the looksmaxxing category
3. Roast text that body-shames specific physical features — the actual high-risk Mogster failure mode (because the looksmaxxing prompt context tells Gemini that's the literal job)

This design ships moderation v1 using only what's already in the stack: **Gemini's built-in safety filter for image screening, DOB attestation at signup for age, and a curated body-feature output blocklist with regenerate-once + safe fallback.** Plus an audit log, three-strike enforcement, and a manual override path. No new vendors.

## Goals

- App-Store-defensible moderation story before public launch
- Self-attestation age gate consistent with category norm (BeReal/Locket/Gas)
- Keep Mogster's brutal voice intact — block body-feature shaming, not roast energy
- Zero new vendor cost; total infra delta over current setup is €0
- GDPR-K / COPPA-defensible without parental-consent flow

## Non-goals (deferred)

- Sightengine or any image-classification vendor — V2 if Gemini false-positive rate exceeds 2% post-launch
- Image-side age estimation — V2 if telemetry shows actual under-16 leakage despite DOB attestation
- Verifiable Parental Consent integration — Year 2+ if 13-15 EU expansion becomes strategic
- LLM-judge for output moderation — V2 if blocklist proves insufficient
- In-app appeals UI — email-based manual override is fine pre-launch
- Storing rejected image bytes — SHA-256 only

---

## Architecture

### Request flow (post-implementation)

```
POST /aura/check                                     (existing route)
   │
   ├─ Multipart parse + MIME validation              (existing)
   ├─ Per-user daily limit (15/day)                  (existing)
   │
   ├─ STRIKE CHECK (new)
   │    └─ Query moderation_events for user_id
   │       Hard-locked → 403 with hard_locked card
   │
   ├─ COST CIRCUIT BREAKER (new)
   │    └─ Redis daily counter: if today's Gemini calls > 5_000
   │       → fail-closed with system_busy reason
   │
   ├─ Buffer → base64                                (existing)
   ├─ Storage upload                                 (existing)
   │
   ├─ GEMINI CALL with explicit safetySettings (modified rate.ts)
   │    ├─ HARM_CATEGORY_SEXUALLY_EXPLICIT → BLOCK_MEDIUM_AND_ABOVE
   │    ├─ HARM_CATEGORY_DANGEROUS_CONTENT → BLOCK_MEDIUM_AND_ABOVE
   │    ├─ HARM_CATEGORY_HARASSMENT        → BLOCK_MEDIUM_AND_ABOVE
   │    └─ HARM_CATEGORY_HATE_SPEECH       → BLOCK_MEDIUM_AND_ABOVE
   │
   ├─ Inspect response.candidates[0].finishReason
   │    ├─ "SAFETY"  → throw ModerationBlockError(category)
   │    ├─ "STOP"    → continue with response.text()
   │    └─ other     → throw generic error
   │
   ├─ OUTPUT BLOCKLIST (new) — runs on the roast text
   │    ├─ Match against ~140 entries (4 categories)
   │    ├─ On hit: log event, re-call Gemini with strict-prompt variant
   │    └─ On 2nd hit: substitute safe fallback roast
   │
   ├─ DB insert + leaderboard + stats (existing)
   └─ Response
```

When `ModerationBlockError` is thrown, the route handler:
- Logs to `moderation_events` with `event_type='gemini_safety'`
- Computes copy_tier from the user's strike count in past 24h
- Returns 403 with `{error: 'AURA_UNREADABLE', copy_tier, retry_allowed, retry_after, hard_locked}`

### File layout

| File | Purpose | New / Modified |
|---|---|---|
| `server/src/ai/rate.ts` | Add explicit `safetySettings`, throw typed `ModerationBlockError` on SAFETY finishReason | MODIFIED |
| `server/src/ai/errors.ts` | Define `ModerationBlockError` class | NEW |
| `server/src/lib/blocklist.ts` | Match function with category routing | NEW |
| `server/src/lib/blocklist-data.ts` | The ~140-entry term arrays, separated for easy editing | NEW |
| `server/src/lib/strikes.ts` | Strike-count queries against moderation_events | NEW |
| `server/src/middleware/moderation.ts` | Rewritten — orchestrator wraps Gemini SAFETY → strikes → logging → circuit breaker | MODIFIED |
| `server/src/routes/aura.ts` | Wire moderation gate; output blocklist post-call | MODIFIED |
| `server/src/routes/auth.ts` (or signup endpoint) | Validate DOB ≥16, persist to `profiles.dob` | MODIFIED — TBD which file |
| `supabase/migrations/005_moderation.sql` | `moderation_events` table + `profiles` lock columns + `profiles.dob` + retention pg_cron | NEW |
| `server/src/middleware/__tests__/moderation.test.ts` | Unit tests | NEW |
| `server/src/routes/__tests__/aura.test.ts` | Integration tests | NEW or extend |

### App-side changes

Two surfaces:

**1. Signup flow** ([app/app/auth/signup.tsx](../../app/app/auth/signup.tsx) or wherever the signup form lives):
- DOB picker (date input)
- "I confirm I'm 16+" checkbox (unchecked by default; submit disabled until checked)
- ToS link with explicit age section
- Client-side guard: reject submission if computed age <16

**2. Rejection card** (new):
- New `<ModerationRejectCard />` — customs-form / "RETURN TO SENDER" stamp aesthetic, NOT the score card
- Three copy tiers (TIER_A_COPY, TIER_B_COPY, TIER_C_COPY constants)
- Hard-locked variant with mailto:help@mogster.app

Error response shape from `/aura/check` on moderation reject:

```ts
{
  error: "AURA_UNREADABLE",
  copy_tier: "A" | "B" | "C",
  retry_allowed: boolean,
  retry_after?: string,    // ISO timestamp if soft_locked
  hard_locked?: boolean
}
```

App-side typed `ModerationError` class in `app/src/lib/api.ts`.

---

## Decisions locked in

### 1. NSFW: Gemini built-in `safetySettings`

Gemini Flash has multimodal safety classification on every request. Configure explicitly:

```ts
safetySettings: [
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: BLOCK_MEDIUM_AND_ABOVE },
]
```

When triggered, Gemini returns `finishReason: SAFETY` (not text). Wrapper in `rate.ts` inspects this BEFORE calling `.text()` and throws a typed `ModerationBlockError`.

| Why Gemini built-in over Sightengine |
|---|
| Already in the request — €0 cost, 0ms latency added |
| Catches clear nudity, explicit content, dangerous imagery reliably |
| Single vendor surface — no new API key, no circuit breaker tuning, no rate-limit coordination |
| Industry-standard claim: "we use Gemini's multimodal safety classification on every upload" |
| Gemini changes policy: 2-day job to swap to Sightengine. Not a v1 risk. |

| What we lose vs. Sightengine |
|---|
| Numeric per-class thresholds (Gemini gives 4 block levels, Sightengine gives 0.0–1.0) |
| ~5% of borderline content (suggestive but not explicit) — caught by output blocklist downstream anyway |
| Independent vendor (vendor diversification is V2 thinking) |

### 2. Age: DOB + checkbox at signup, server-enforced

```
Signup form fields:
  - Email
  - Password
  - Username
  - DOB (date picker)
  - [ ] I confirm I'm 16+ (required)
  - [link] Terms — section 4: "Mogster is for users 16+. Lying about age = account deletion."
```

Server-side on signup:
- Validate `(today - dob) >= 16 years`
- Store `dob` on `profiles.dob` column
- Reject signup with 422 if under 16: copy `"Mogster is for ages 16 and up. Come back when you're cooking."`

Reasonable-belief defense:
- Self-attestation + DOB + ToS clause = the standard consumer-app posture
- BeReal, Locket, Gas, Snapchat, Discord — all use this
- App Store age rating: answer the content questionnaire honestly. Expected outcome: **12+** (matches TikTok/IG/Snap/BeReal/Umax). If Apple bumps to 17+ during review, accept. App Store rating is content disclosure, not user gating — DOB-at-signup is the real age gate.

### 3. Output blocklist: ~140 entries, 4 categories, regenerate-once

```
Slurs:                ~30 entries (race, sexuality, gender, ableist)
Self-harm:            ~15 entries (incl. leetspeak variants of "kys")
Body-feature shaming: ~80 entries (THE big one — nose/weight/skin/teeth/jaw/hairline patterns + surgery refs)
Sexual:               ~15 entries (explicit terms only)
```

**Match logic:** lowercase substring against word boundaries, plus one regex pattern (`/you look like a [0-9]\/10/i`).

**On hit:**
1. Log to `moderation_events` with `event_type='output_blocklist'`, `severity='regenerated'`, `matched_term`
2. Re-call Gemini with strict system prompt: *"previous output violated policy. Rewrite roasting AURA only — do not reference body features, weight, skin, or specific physical traits"*
3. Re-run blocklist on retry
4. If retry also fails: substitute safe fallback roast (`"the AI couldn't read this one. vibes were too chaotic. try again."`)
5. Log retry-fail as `severity='reject'`

**Brand-safe terms NOT in blocklist:** sigma, mogger, brainrot, skibidi, down bad, looksmaxxing, mid, cooked, ohio. These are core copy.

### 4. Three-strike retry + manual override

| Strike # | Window | Action |
|---|---|---|
| 1, 2 | per session | Show TIER A / B copy, allow immediate retry |
| 3 | 24h (per `user_id` or `ip_address`) | Show TIER C copy. Soft-lock for 24h. |
| 5 | 7 days | Hard-lock. Manual review only. |

Strike events counted: any `severity='reject'` row in `moderation_events` for the user/IP.

**Recovery for false positives:**
- User emails `help@mogster.app` (mostly NSFW false-positives now — e.g., a beach selfie hitting Gemini's medium-threshold)
- Founder eyeballs the image, runs `UPDATE profiles SET moderation_override = true WHERE id = '...'`
- Override bypasses ALL safety re-checks for that user (Gemini may still block, but the strike-counter ignores them)
- Expected volume <5/week pre-launch — no in-app appeals UI

### 5. Rejection UX: tiered, brand-voice, no reason disclosure

Three copy tiers, never reveal what was actually flagged:

```
TIER A (1st reject in session)
  Headline: AURA UNREADABLE.
  Sub:      keep building, king. drop another.

TIER B (2nd reject in session)
  Headline: SYSTEM CAN'T LOCK IN.
  Sub:      your aura's loading. try a different angle.

TIER C (3rd reject in 24h — soft-lock incoming)
  Headline: WE COULDN'T COOK THIS ONE.
  Sub:      take 5. come back. the kitchen's open later.

HARD-LOCKED
  Headline: ACCOUNT UNDER REVIEW.
  Sub:      email help@mogster.app to unlock — we'll cook again soon.
```

**Card component:** must NOT reuse the score-card style. Use a "RETURN TO SENDER" / customs-form stamp aesthetic to disambiguate from a real low score.

### 6. DB schema

```sql
-- supabase/migrations/005_moderation.sql

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE moderation_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz NOT NULL DEFAULT now(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address  inet,
  event_type  text NOT NULL CHECK (event_type IN (
    'gemini_safety','output_blocklist','provider_error','system_busy'
  )),
  severity    text NOT NULL CHECK (severity IN (
    'reject','regenerated','soft_flag'
  )),
  provider    text NOT NULL,
  provider_response jsonb,        -- Gemini safetyRatings array, etc.
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
-- No policies → admin-only via service role.

ALTER TABLE profiles ADD COLUMN dob                 date;
ALTER TABLE profiles ADD COLUMN moderation_override boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN soft_locked_until   timestamptz;
ALTER TABLE profiles ADD COLUMN hard_locked         boolean DEFAULT false;

-- Retention: pg_cron daily at 03:00 UTC
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

Note: `event_type` enum no longer includes `image_nsfw` or `image_age` — those events are now subsumed by `gemini_safety`. The Gemini SAFETY response indicates the category in `provider_response.safetyRatings`.

### 7. PII: SHA-256 only, no image storage

- Reject path: hash the buffer with SHA-256, log the hash, throw away the bytes
- Accept path: existing Supabase Storage upload (under user's folder) is unchanged
- Gemini's safetyRatings response (per-category block decision + score) goes in `provider_response` jsonb — that's the audit trail

### 8. Cost ceiling

**Single Redis circuit breaker on Gemini calls** — at the start of every `/aura/check`:

```ts
const today = new Date().toISOString().split('T')[0];
const dailyKey = `gemini:calls:${today}`;
const count = await redis.incr(dailyKey);
if (count === 1) await redis.expire(dailyKey, 86_400);
if (count > 5_000) {
  await logModerationEvent({ event_type: 'system_busy', severity: 'reject', ... });
  return { allow: false, reason: 'system_busy' };
}
```

5,000/day cap = ~$0.0125/day Gemini ceiling at current Flash pricing, ~$4.50/mo absolute worst case. Catches:
- Viral spikes
- Abuse / scripting
- Bugs (infinite-retry loops in the app)

**Tunable:** raise to 20K post-launch once real traffic is observed. The cap protects against surprise; the actual budget headroom is much larger.

### 9. Tuning loop

**4-week observation window post-launch:**

| Week | Action |
|---|---|
| 1–4 | Log every rejection with full Gemini safetyRatings response. No threshold changes. |
| 5 | Manually sample 50 rejections, eyeball-classify true vs false positives |
| 5+ | If FP rate > 5% on legitimate selfies, drop SAFETY threshold to BLOCK_ONLY_HIGH for SEXUALLY_EXPLICIT (less aggressive) |
| 5+ | If FP rate > 10%, V2 evaluation: add Sightengine NSFW for precision |
| Ongoing | Iterate body-feature blocklist from observed `output_blocklist` regenerated events |

---

## Why parental consent is out of scope (unchanged from v1)

**The lane Mogster is in:** "16+, period. We don't serve minors, with or without consent." This is where BeReal, Locket, Gas, and most indie social apps sit. Operationally:

1. Self-attestation (DOB + checkbox) at signup — this design
2. App Store 17+ rating
3. ToS termination clause for age fraud
4. Privacy policy excludes under-16
5. Reasonable-belief defense if a 14-year-old lies

Building a Verifiable Parental Consent flow costs $1–3 per consented child via PRIVO/SuperAwesome/Veratad + $500–2K/mo platform fee + 2–3 engineer-weeks. Out of scope at €100K solo-founder pre-launch stage. Revisit at €1M ARR if 13-15 EU expansion becomes strategic.

---

## Testing

### Unit tests (`server/src/middleware/__tests__/moderation.test.ts`)

```
moderateImage()  -- now thin: takes the result of rate.ts, applies strikes, returns ModerationResult
  ✓ allows when rateAura returns successfully
  ✓ rejects with copy_tier=A on first ModerationBlockError in series
  ✓ rejects with copy_tier=B on second
  ✓ rejects with copy_tier=C and soft_lock at 3rd reject in 24h
  ✓ hard-locks at 5 rejects in 7d (short-circuits Gemini call)
  ✓ trips circuit breaker at 5001st Gemini call of the day
  ✓ logs moderation_event on every reject
  ✓ moderation_override profile bypasses lock-counter (Gemini may still block)

moderateOutput()
  ✓ passes clean roast unchanged
  ✓ flags slur match
  ✓ flags self-harm match (incl. leetspeak)
  ✓ flags body-feature shame ("your nose is crooked")
  ✓ does NOT flag brand terms (mogger, sigma, brainrot, etc.)

strikes
  ✓ does not soft-lock at 2 rejects in 24h
  ✓ soft-locks at 3 rejects in 24h
  ✓ hard-locks at 5 rejects in 7d
```

### Integration tests (`server/src/routes/__tests__/aura.test.ts`)

```
POST /aura/check
  ✓ returns AURA_UNREADABLE on Gemini SAFETY block
  ✓ does NOT insert into aura_checks on reject
  ✓ regenerates roast when output blocklist matches
  ✓ returns safe fallback roast on regenerate-fail
  ✓ moderation_override bypasses strikes (NSFW still blocks via Gemini)

POST /auth/signup (or wherever signup is)
  ✓ rejects DOB that makes user <16 with 422
  ✓ rejects missing age_confirmed checkbox with 422
  ✓ stores dob in profiles on success
```

### Manual QA before TestFlight

- [ ] Submit known-safe adult selfie → success path works
- [ ] Submit explicit content → Gemini SAFETY → TIER A copy
- [ ] Submit safe selfie 3× rapidly with `event_type=gemini_safety` injected via test → TIER C copy + soft-lock
- [ ] Manually set `moderation_override=true` on test account → strike counter ignores future rejects
- [ ] Force a Gemini timeout → fail-closed with copy
- [ ] Submit a photo whose roast hits a body-feature term → regenerated, 2nd output is clean
- [ ] Verify `moderation_events` rows exist for each above with correct event_type
- [ ] Try signup with DOB making user <16 → 422 rejection with correct copy
- [ ] Try signup without checking the checkbox → submit button disabled / 422

---

## Risks + mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Gemini SAFETY false-positives on legitimate selfies | Medium | Medium UX | 4-week tuning loop; drop threshold to BLOCK_ONLY_HIGH; manual override path |
| Body-feature blocklist incomplete | High initially | Medium | Iterate from logged regenerated events; broad category coverage from day 1 |
| User lies about DOB | High | Low (with mitigations) | Reasonable-belief defense; Gemini SAFETY still catches NSFW; ToS termination clause |
| Cost spike from viral hit | Medium | Low | Redis circuit breaker at 5K/day; Gemini Flash is cheap (~$0.0125/day cap) |
| User claims discrimination on reject | Low | Medium reputational | Generic copy, no reason disclosure, manual review path |
| GDPR/COPPA enforcement action | Very low | Very high | Reasonable-belief posture documented; 16+ messaging consistent; DOB stored |
| `moderation_events` table grows unbounded | Medium | Low | pg_cron retention job (30/90 day tiers) |
| Gemini changes safety policy mid-launch | Low | Medium | 2-day swap to Sightengine if needed; not a v1 risk |

---

## V2 follow-ups (post-launch, NOT in this PR)

Captured here so they don't get lost:

- Sightengine NSFW as belt-and-suspenders if Gemini false-positive rate > 2%
- Image-side age estimation if telemetry shows under-16 leakage despite DOB
- LLM-judge for output moderation if blocklist proves insufficient after 4 weeks
- Slack/Discord webhook for circuit-breaker alerts
- Per-IP strikes for guest mode (depends on W2 `/aura/rate-guest` endpoint existing first)
- Image fingerprinting for repeat-offender detection
- In-app appeals UI (only at >100K MAU)
- Per-region threshold tuning (UK 13 vs DE 16)
- Verifiable Parental Consent integration (Year 2+)

---

## Approval

**Approved by:** Grgur, 2026-04-27 (v3 — final)
**Implementation:** see [2026-04-26-moderation-implementation.md](./2026-04-26-moderation-implementation.md)
