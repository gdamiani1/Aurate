# Aura Battles — Design Doc

**Date:** 2026-04-14
**Status:** Design approved, ready for implementation plan
**Related:** Mogster mobile app, Fastify API, Supabase Postgres, Gemini 2.5 Flash

## Overview

Add a player-vs-player challenge mode where two friends submit camera-only photos and the AI picks a winner in a dramatic anime-boxing reveal. Each user maintains a boxer-style Win-Loss-Draw record with a streak counter.

## Goals

- Head-to-head challenge format between accepted friends
- Camera-only submissions (no gallery uploads, enforced client + server side)
- Deterministic winner selection based on existing aura scoring, augmented with a cheap text-only Gemini call for a comparative fight narrative
- Boxing-style W-L record per user, visible on their profile
- Cinematic anime-style reveal screen as the "money shot" of the feature

## Non-Goals (MVP)

- No public battles feed (private by default, shareable via explicit action)
- No tournaments or brackets
- No ranked matchmaking with strangers — friends only
- No video battles — still photos only
- No live real-time duels — async with 24h window

## User flow

```
Challenger taps friend in Battles tab
  → picks Sigma Path
  → camera opens, captures photo
  → /battles/create runs /aura/check internally
  → battle row created, status=awaiting_opponent, 24h expiry
  → push notification to opponent

Opponent opens push
  → /battles/accept/[id] screen
  → challenger photo hidden until opponent submits
  → camera opens, captures photo
  → /battles/:id/accept runs /aura/check internally
  → server picks winner (higher score, tiebreak by max stat)
  → generateFightNarrative() — single text-only Gemini call
  → battle row updated, W-L records updated
  → push notification to both players
  → both users land on anime reveal screen
```

## Architecture

### Judging approach

**Each photo runs through the existing /aura/check pipeline unchanged.** The challenger's path is locked in and used for both submissions so the comparison is on the same lens.

Winner = higher `aura_score`. Ties broken by the highest single stat. If still tied, the battle is recorded as a DRAW.

A third, cheap Gemini call (text-only, ~200 output tokens) generates the fight narrative given both scores, stats, and individual roasts. No images in this call.

### Margin classification
- `TKO` — winner beats loser by more than 200 points
- `UD` (Unanimous Decision) — margin is 51–200 points
- `SD` (Split Decision) — margin is 1–50 points
- `DRAW` — exact tie after tiebreaker
- `FORFEIT` — opponent didn't respond within 24h

### Cooldown
After a loss, the loser cannot rematch the same opponent for 24 hours. Server-side check at challenge creation.

### Camera-only enforcement
- Client uses `launchCameraAsync` only on the challenge screens (no gallery picker)
- Server requires an `x-source: camera` header on battle submission endpoints and rejects otherwise
- Defense in depth — even a modified client can't submit a gallery photo

## Database schema

### New `battles` table

```sql
CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sigma_path TEXT NOT NULL,

  challenger_check_id UUID REFERENCES public.aura_checks(id) ON DELETE SET NULL,
  opponent_check_id UUID REFERENCES public.aura_checks(id) ON DELETE SET NULL,

  winner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  margin TEXT CHECK (margin IN ('UD','SD','TKO','DRAW','FORFEIT')),
  narrative JSONB,

  status TEXT NOT NULL DEFAULT 'awaiting_opponent' CHECK (status IN (
    'awaiting_opponent', 'completed', 'expired', 'cancelled'
  )),

  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CONSTRAINT battles_challenger_not_opponent CHECK (challenger_id <> opponent_id)
);

CREATE INDEX idx_battles_challenger ON public.battles(challenger_id, created_at DESC);
CREATE INDEX idx_battles_opponent ON public.battles(opponent_id, created_at DESC);
CREATE INDEX idx_battles_active ON public.battles(opponent_id, status)
  WHERE status = 'awaiting_opponent';
```

### Extend `profiles` table

```sql
ALTER TABLE public.profiles
  ADD COLUMN battle_wins INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN battle_losses INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN battle_draws INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN battle_streak INTEGER DEFAULT 0 NOT NULL;
```

`battle_streak` is signed: positive for win streak, negative for loss streak. Resets to 0 on draw.

### RLS
- `SELECT`: Users can read battles where they are challenger or opponent
- `INSERT`: Handled via server (service role) — no direct client inserts
- `UPDATE`: Handled via server only

## API endpoints

All under `/battles`, all require `Authorization: Bearer <jwt>`.

### `POST /battles/create`
Challenger starts a battle. Multipart upload.
- **Headers**: `x-opponent-username`, `x-sigma-path`, `x-source: camera`
- **Body**: `file` (image)
- **Validation**: Opponent exists + is friend, no 24h loss cooldown, no existing pending battle between pair, camera source header present
- **Effects**: Runs `rateAura()` internally, inserts `aura_check`, inserts `battle`, sends push
- **Returns**: `{ battle_id, expires_at }`

### `POST /battles/:battleId/accept`
Opponent submits. Multipart upload.
- **Headers**: `x-source: camera`
- **Body**: `file` (image)
- **Validation**: Caller is the opponent, status is `awaiting_opponent`, not expired, camera source header present
- **Effects**: Runs `rateAura()` with locked sigma_path, inserts `aura_check`, picks winner, classifies margin, calls `generateFightNarrative()`, updates battle + both profiles, pushes to both
- **Returns**: Full battle result

### `POST /battles/:battleId/decline`
Opponent dismisses. Sets status to `cancelled`. No record change.

### `GET /battles/active`
Returns all awaiting battles where user is challenger or opponent. Side-effect: processes expired battles in-line (server-side forfeit processing).

### `GET /battles/history`
Last 50 completed battles for the user, newest first.

### `GET /battles/:battleId`
Full battle detail. Gated to participants.

## New AI helper: `generateFightNarrative`

`server/src/ai/battle.ts` — text-only Gemini call.

**Input**: challenger name, opponent name, both scores, both top 3 stats, both roasts, sigma_path, winner_id, margin.

**System prompt**: "You are an anime boxing commentator crossed with a gen alpha brainrot TikToker. Write a 3-4 round fight narrative in dramatic round-by-round style, referencing the actual stats and names provided. End with a devastating final line. Stay in character for the full response. Return valid JSON only."

**Output**:
```json
{
  "rounds": [
    "Round 1: challenger steps into the ring, the fit is COOKING, Outfit 82...",
    "Round 2: opponent fires back with 91 Charm, the jury is STUNNED...",
    "Round 3: challenger lands the finishing blow — 847 vs 712..."
  ],
  "final_line": "challenger is HIM. opponent crashed out."
}
```

## UI

### Nav change
Replace the **Circle** bottom tab with **Battles**. Battles tab has a top segmented control:
- **Friends** — existing circle content (friend list, pending requests, link-up)
- **Battles** — the new battles UI

Total bottom tabs remain 4: Vibe Check, Mog Board, Your Aura, Battles.

### Battles screen layout

```
YOUR RECORD
  12 W · 3 L · 1 D   ·   🔥 3W streak

⚔ ACTIVE
  [cards for each awaiting battle]
   · challenger view: "You challenged @jake · 4h ago"
   · opponent view:  "@maya challenged you · 18h left"   [Accept] [Decline]

HISTORY
  [cards for each completed battle, newest first]
   · ✅ W vs @maya · TKO · 2h ago
   · ❌ L vs @jake · SD · yesterday
```

Cards are tappable → opens reveal screen (history) or accept screen (active opponent).

### New screens

1. **`app/battles/challenge/[friendId].tsx`** — Start a challenge
   - Friend avatar + username + their W-L record
   - Sigma Path pill selector
   - Big "Start Battle" button → launches native camera
   - After capture: preview → "Send Challenge" confirms submission
   - Loading state while AI rates
   - Success: navigate back to Battles with toast

2. **`app/battles/accept/[battleId].tsx`** — Opponent submits
   - Shows challenger info (avatar, username, record)
   - Challenger photo is **blurred/hidden** until opponent submits
   - Locked sigma path displayed as badge
   - Countdown to expiry: "18h 23m left"
   - "Take Your Shot" button → native camera → preview → submit
   - Loading while AI rates + narrative generates
   - Navigates directly to reveal screen on completion

3. **`app/battles/reveal/[battleId].tsx`** — The anime reveal screen

### Anime reveal screen choreography

Full-screen immersive. Five phases:

**Phase 1 — Entrance (1s)**
Dark screen, glitching purple flashes, "AURA BATTLE" neon text with shake animation.

**Phase 2 — Fighter intro (3s total)**
Diagonal split reveal, challenger on left, opponent on right. Each side shows photo with gradient border in their aura colors, username, W-L record, and label ("CHALLENGER" / "DEFENDER"). Animated VS lightning bolt in center.

**Phase 3 — Round-by-round commentary (6s)**
Narrative rounds fade in with typewriter effect, ~1.5s each. Screen shake + flash on each new round. Text is white, large, dramatic.

**Phase 4 — Final verdict (3s)**
Zoom on winner card. "WINNER" banner slams in with shake animation. Stat bars fill to show score difference. Margin badge ("TKO", "UD", "SD", "DRAW").

**Phase 5 — Scorecard (static, tap to dismiss)**
Full side-by-side stat comparison. Aura scores displayed in big numerals. Record deltas shown: "+1 W" (green) / "+1 L" (red). Two buttons: **Share** and **Rematch** (if no cooldown).

### Implementation primitives
- `react-native-reanimated` for all animations (60fps)
- `LinearGradient` for fighter card borders in aura colors
- `withTiming` + `withSequence` for phase choreography
- Screen flash: overlay View with opacity animation
- Shake: `translateX` spring
- Typewriter: character-by-character reveal via `useEffect` timer
- Haptics: `expo-haptics` notification feedback on winner reveal
- Sound (optional for MVP): `expo-av` ding on round transitions

## Push notifications

- **Challenge sent** → opponent: `"@gdamiani challenged you to Mogger Mode. 24h to fight back ⚔"`
- **Battle completed** → both: `"⚔️ Battle result is in"`
- **Battle expired** → challenger: `"@maya ghosted. You win by forfeit, bro 🏆"`

Notifications tap-through deep-links to the relevant screen (accept or reveal).

## Error handling

- **Opponent not a friend** → 403, "Only friends can battle"
- **24h cooldown active** → 409, "Can't rematch for 24h after a loss"
- **Existing pending battle** → 409, "You already have a pending battle with this user"
- **Battle expired between GET and accept** → 410, show "This battle expired" screen
- **Non-camera source** → 400, "Battles require camera only"
- **Narrative generation fails** → server falls back to a template narrative using both roasts; battle still completes
- **Gemini rate limited** → 503, "The AI is overloaded rn, try again in a sec"

## Testing approach

- **Unit**: winner selection logic (tiebreak order), margin classification, cooldown check
- **Integration**: full battle lifecycle end-to-end against Supabase + Gemini
- **Manual**: two phones, real push notifications, end-to-end anime reveal rendering at 60fps

## Rollout plan

1. DB migration (battles table + profile columns) — ship first, safe to deploy
2. Server routes + AI helper — deploy, battles can be created via direct API calls
3. Mobile UI — ship as a single release (new tab, new screens, reveal)
4. Enable push notifications — requires opponent/challenger to have registered tokens

## Open questions

- Share screen format — for v1, share the reveal screen as a captured image via `react-native-view-shot` (same pattern as the aura card Save button)
- Sound effects — skip for MVP, add later if the visual reveal feels flat
- Spectator mode (watching active battles) — out of scope, future work
