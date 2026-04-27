# Mogster Design Implementation — Phased Plan

**Date:** 2026-04-28
**Status:** Phase 1 complete; Phases 2-4 ready to execute
**Source of truth:** `docs/design/system/` (Claude Design handoff bundle)
**Brand bible:** `docs/design/system/project/README.md`
**Tokens:** `docs/design/system/project/colors_and_type.css`

---

## Why phased

The Claude Design handoff is a 14-screen iOS UI kit + 25 specimen cards + full token system + brand bible. Realistically a 2-3 day implementation. Single-session attempts produce half-done redesigns that ship inconsistent UI.

Phase boundaries pick natural commit points where the codebase stays shippable.

---

## Phase 1 — Foundation (DONE)

**Goal:** new tokens available, nothing broken.

- ✅ Bundle saved to `docs/design/system/`
- ✅ `app/src/constants/theme.ts` refreshed with canonical token names (`ink`, `hazard`, `paper`, etc.) + backwards-compat aliases (`bg`, `primary`, `textPrimary`, etc.)
- ✅ Added missing tokens: `tierGold`, `tierBronze`, `tierGrey`, hazard alpha variants (25/12/06), `arcCyan`, semantic `TYPE` scale, `MOTION` timings, expanded `SPACING` (s2x/s3x/s4x)
- ✅ App typecheck clean — 416 existing token references still resolve

Existing screens still render with old token names. New code uses new names.

---

## Phase 2 — High-impact screen refactors (~3-4 hrs)

The screens that ship the brand and drive user actions get rebuilt first.

### 2.1 Result Card (highest leverage)
**Why first:** the screenshotable artifact. Every share is an install ad. K-factor lives in this design.

- File: `app/src/components/AuraResultCard.tsx`
- Reference: `docs/design/system/project/preview/components-result-card.html` + `ui_kits/mogster_app/screens.jsx` (Screen 06 — Score Result)
- 9:16 portrait card, full-bleed photo top 75%, dark fade bottom 55%
- Hazard-tinted crop marks at all 4 corners
- Top metadata strip (rotated path-stamp + issue number + date)
- Bottom editorial block (tier label + huge Anton score + roast)
- Per-tier styling — see Tier Accents specimen (heavily iterated, see chat 2026-04-27)

### 2.2 Mog Board #1 throne (heavily iterated)
**Why:** climbing should feel like climbing.

- File: `app/app/(tabs)/mogboard.tsx`
- Reference: `preview/components-leaderboard.html`
- #1 row: hazard-yellow throne + shimmer + crown stamp + streak bar
- "your row" delta: glows mint with "+3 spots · glowing up" label and ghost trail
- Avoid uniform list — top-3 reads like a podium

### 2.3 Home (Vibe Check) tab alignment
**Why:** core daily action, but lens-picker work overlaps with W2 plan.

- File: `app/app/(tabs)/index.tsx`
- Apply new tokens (paperMute → ghost where appropriate)
- DEFER lens-picker UI rebuild to W2 ([docs/plans/2026-04-22-lens-picker-guest-mode-implementation.md](./2026-04-22-lens-picker-guest-mode-implementation.md))
- Card preview area + tier reveal rebuilt per design

**Phase 2 commit gate:** all three above shipping with consistent voice + typography. App still functional through and through.

---

## Phase 3 — New / heavily redesigned screens (~4-6 hrs across 2 sessions)

Screens that need ground-up work, not just token migration.

### 3.1 Loading "dossier under review" (heavily iterated)
**Final design from chat (2026-04-27):**
- Tilted paper polaroid card, hazard-yellow photo slot showing user silhouette
- Hazard scan line sweeping over the photo
- Red `PENDING` stamp slamming in every 3.6s
- Big display-type verdicts cycling ("computing the mog differential", "checking if you're HIM", "the AI is cooking rn")
- 5 hazard-stripe metric bars filling at staggered rates: DRIP, JAWLINE, SIGMA INDEX, VIBE, RIZZ
- Live press-ticker: `▲ JAWLINE +7 · ▼ NPC ENERGY −3 · ! COOKING DETECTED`
- Hazard-stripe progress bar
- Reference: `preview/components-loading.html` (final iteration)
- File: replace inline loading state in `app/app/(tabs)/index.tsx` with extracted `<DossierLoadingScreen />` component

### 3.2 Splash + Age Gate
- Splash: big wordmark + age warning, slam-cut to next
- Age Gate: DOB picker + 16+ checkbox (existing, polish for design alignment)
- Reference: `ui_kits/mogster_app/screens.jsx` Screens 01 + 02
- Files: `app/app/_layout.tsx` (splash), `app/app/auth/signup.tsx` (age gate refresh)

### 3.3 Settings polish
- Reference: `ui_kits/mogster_app/screens.jsx` Screen 14
- File: TBD — settings screen doesn't exist yet at app/app/settings/, will create

### 3.4 Top Tier (1000) — Skibidi Legendary blowout
- Reference: `preview/colors-tiers.html` (final glitch iteration: RGB chroma split, animated holographic gradient, judder, scanlines, flickering GLITCH stamp)
- One-time celebration on score = 1000
- Files: extension to `AuraResultCard.tsx` with rare-max state

---

## Phase 4 — Blocked on dependencies

### 4.1 Paywall (Cookbook) — blocked on W5
- W5 ships the StoreKit / RevenueCat integration
- Design ready in `ui_kits/mogster_app/screens.jsx` Screen 11
- Implementation comes WITH the W5 work, not before

### 4.2 Pick-a-Lens redesign — blocked on / merges with W2
- W2 ships the lens picker modal at [docs/plans/2026-04-22-lens-picker-guest-mode-implementation.md](./2026-04-22-lens-picker-guest-mode-implementation.md)
- Design output (`preview/components-chips.html` + Screen 04) becomes the visual spec for that W2 task
- Don't double-implement — W2 plan execution applies the design

---

## Token migration strategy

Don't bulk-rename across the 416 existing references. Instead:

1. **Phase 2/3 work touches a screen → migrate that screen's tokens to canonical names** as part of the redesign
2. **Eventually the legacy aliases are unused** → delete them in a final cleanup commit
3. **New screens use canonical names from day 1**

This avoids the "one giant rename PR" pattern that breaks reviews and creates merge hell.

---

## Verification protocol

For each phase:
- App typecheck clean (`npx tsc --noEmit` in `app/`)
- Server tests still passing (`npm test` in `server/`) — should be unaffected
- Visual smoke test on Expo Go before commit
- TestFlight build only at phase boundaries, not per-task

---

## Decision log

- **2026-04-28:** Phase 1 shipped. Token foundation in place. Ready for Phase 2.
- **2026-04-28:** BLOOD mode deferred to V2 (see [decision-two-mode-design](../../Memory/decisions/decision-two-mode-design.md)) — single direction implemented.
- **TBD:** Phase 2 priority decision — Result Card first vs. Mog Board first?

---

## Related
- [docs/design/system/README.md](../design/system/README.md) — handoff bundle root
- [docs/design/system/project/README.md](../design/system/project/README.md) — brand bible
- [docs/design/system/project/SKILL.md](../design/system/project/SKILL.md) — agent entry point
- [Memory/decisions/decision-two-mode-design.md](../../Memory/decisions/decision-two-mode-design.md) — single-mode decision
- [Memory/preferences/preferences-engineering-defaults.md](../../Memory/preferences/preferences-engineering-defaults.md) — anti-overengineering / phased migration is the default pattern
