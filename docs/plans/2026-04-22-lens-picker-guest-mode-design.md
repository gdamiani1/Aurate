# Lens Picker Modal + Guest Mode — Design Doc

**Date:** 2026-04-22
**Author:** Grgur Damiani (with Claude)
**Status:** Approved — ready for implementation plan

## 1. Goal

Two independent features bundled into one TestFlight build cycle:

1. **Fix the broken lens picker** — the horizontal chip scroll on the home tab renders corrupt / overlapping text (long path names like `LOOKSMAXXING` / `SIGMA GRINDSET` don't fit the flex-row chip layout cleanly). Replace with a tap-to-open vertical modal picker with inline descriptions.
2. **Open the app to guests** — currently the route guard hard-gates every tab behind signup. Invert this: guests can browse the UI, take **one free aura rating** to experience the product, then hit a signup wall for any further action.

## 2. Scope

**In scope:**
- Vertical modal lens picker (7 paths with descriptions)
- Home tab's "PICK YOUR LENS" section → compact current-selection row that opens the modal
- Remove the `!user → /auth/signup` redirect from `_layout.tsx` route guard
- Onboarding stays in the flow for everyone (including guests), ends at notification primer
- New `/aura/rate-guest` Fastify endpoint — unauthenticated, ephemeral (no DB write), rate-limited by IP
- Client-side `guest_uploads_used` flag in AsyncStorage
- Signup wall bottom sheet shown when a guest hits a gated action
- `Your Aura` + `Battles` tabs render empty-state + signup CTA for guests
- `Mog Board` renders read-only for guests (profile taps open signup sheet)

**Out of scope (deliberate):**
- Persisting the guest's free rating into their first `aura_check` on signup (merge flow)
- Device fingerprinting to prevent reinstall-reuse
- Anonymous leaderboard participation
- Per-category guest-mode feature flags
- Gate customization beyond the four surfaces listed

## 3. Feature A — Lens picker modal

### 3.1 Home tab change

Replace the horizontal `ScrollView` + chip rendering at `app/app/(tabs)/index.tsx:444-479` with a **compact "current selection" tile**:

```
01 / PICK YOUR LENS
┌────────────────────────────────┐
│  01  AURAMAXXING            →  │
│  Main character energy check.  │
│  Are you HIM or are you mid?   │
└────────────────────────────────┘
```

Styling: same card aesthetic as the daily-challenge banner; tappable; right-arrow chevron signals it opens more. On tap, set `pickerVisible=true`, mount `<LensPicker />`.

### 3.2 Modal

Near-full-screen modal overlay (React Native `<Modal animationType="slide" presentationStyle="pageSheet">` or custom with `Animated` API).

Chrome:
- Top: `HazardStripe` height `md`
- Title row: `PICK YOUR LENS` (Anton 32pt, centered)  +  `✕` close button (top-right, 44×44 tap target)
- Bottom: another `HazardStripe` at the very bottom edge

List body (scrollable if content overflows):
- 7 rows, one per path in `SIGMA_PATHS`
- Each row (tall enough to breathe — ~88px):
  - Left: `01` (JetBrains Mono 12pt, muted)
  - Middle: PATH NAME (Anton 22pt, ink on cream, yellow when selected)
  - Middle, below name: description (JetBrains Mono 11pt, line-height 16)
  - Right: check mark when selected
- Selected row: `bg-hazard-yellow`, ink text; non-selected: `bg-ink`, cream text
- Divider line between rows (`border-t border-ink-muted` or equivalent)
- Tap anywhere on the row: sets selection via `onSelect(id)` and closes modal

Dismiss paths:
- Tap `✕` → close
- Swipe down (if iOS sheet native behavior)
- Selection of any row → close (the selection IS the action)

### 3.3 Component API

**New file:** `app/src/components/LensPicker.tsx`

```tsx
interface LensPickerProps {
  visible: boolean;
  selected: SigmaPathId;
  onSelect: (id: SigmaPathId) => void;
  onClose: () => void;
}
```

No internal state beyond the scroll position. Parent owns selection. This keeps the modal a pure presentational component + testable.

### 3.4 Test coverage

Since the app has no Vitest/RNTL setup (tracked separately), skip unit tests for this component. Visual review + hand testing on TestFlight is enough for MVP.

## 4. Feature B — Guest mode

### 4.1 Route guard change

**File:** `app/app/_layout.tsx` around line 218.

**Current:**
```ts
if (!user) {
  if (!inAuthGroup) {
    router.replace("/auth/signup");
  }
} else if (!onboardingComplete) {
  if (!inOnboarding) {
    router.replace("/onboarding");
  }
} else {
  if (inAuthGroup || inOnboarding) {
    router.replace("/(tabs)");
  }
}
```

**Change to:** remove the `if (!user)` block. Guests flow through onboarding (everyone does). Authenticated users still get bounced out of `/auth/*` if they land there.

```ts
if (!onboardingComplete) {
  if (!inOnboarding) {
    router.replace("/onboarding");
  }
} else if (user && inAuthGroup) {
  router.replace("/(tabs)");
} else if (onboardingComplete && inOnboarding) {
  router.replace("/(tabs)");
}
```

Guests finish onboarding → land on `/(tabs)` → can browse freely.

### 4.2 Per-tab guest behavior

| Tab | Guest render |
|---|---|
| **Vibe Check (/)** | Full layout. Picker works. Daily challenge banner renders (it fetches `/daily/today` which doesn't require auth). Camera tap gated per §4.3. |
| **Mog Board** | Global leaderboard fetched + rendered. Tapping a user row: opens signup sheet. |
| **Your Aura** | Empty state. Center-stacked: icon + `SIGN UP TO TRACK YOUR AURA` headline + primary CTA button → `/auth/signup`. No "settings" sub-card visible (privacy/terms links still shown; nothing user-specific to show). |
| **Battles** | Empty state pattern identical to Your Aura: `SIGN UP TO CHALLENGE FRIENDS`. |

The tabs themselves remain in the tab bar for guests — they can explore.

### 4.3 The 1-free-upload flow

```
Guest on home
    ↓ taps Get Cooked
hasUsedFreeUpload()?
    ├── false → open camera/gallery → POST /aura/rate-guest → render result card
    │           → markFreeUploadUsed()
    │           → result card has "SAVE YOUR AURA → SIGN UP" CTA at bottom
    └── true → open SignupSheet bottom sheet
```

Client-side flag in AsyncStorage: `guest_uploads_used`.
- Read via `hasUsedFreeUpload()` (returns boolean)
- Set via `markFreeUploadUsed()` after a successful guest rating
- Cleared via `resetGuestState()` — called on successful signup (hygiene; the flag is ignored for authed users anyway)

Guest result is **ephemeral** — the component shows it, and that's it. Navigating away loses it. On return to home, next tap → wall.

### 4.4 Signup wall — bottom sheet component

**New file:** `app/src/components/SignupSheet.tsx`

React Native `<Modal>` with `transparent + animationType="slide"` anchored to bottom.

Content:
- Drag handle
- Header: `⚠ SIGN UP TO CONTINUE` (Anton 24pt)
- Body (context-dependent string passed in as `message` prop):
  - From gated 2nd camera tap: `"Save your aura, hit the leaderboard, mog your friends."`
  - From Your Aura tab: `"Your aura history lives here once you've got an account."`
  - From Battles tab: `"Challenge friends to aura battles. Needs an account."`
  - From Mog Board profile tap: `"Tap in to see who's behind the score."`
- Primary button: `CREATE ACCOUNT →` (routes `/auth/signup`)
- Secondary link: `Already have one? SIGN IN →` (routes `/auth/signin`)
- Dismiss: tap scrim, swipe down, or X in top-right

### 4.5 Server changes

**File:** `server/src/routes/aura.ts`

Add a new handler `POST /aura/rate-guest`:
- **No** `preHandler: requireAuth`
- Accepts same body as `/aura/rate` (image + sigma_path)
- Uses the same Gemini rating helper
- Returns the same response shape **minus** `id`, `created_at`, and any persistence-tied fields
- **Does not insert** into `aura_checks`
- Does not apply the daily-challenge bonus (keep the bonus as a signed-up-user perk)
- Rate-limited via Upstash Redis: 3 calls per IP per day. Key: `guest-rate:${ip}:${YYYY-MM-DD}`, TTL 24h, reject with 429 when exceeded.

### 4.6 Client aura fetch split

**File:** `app/src/lib/api.ts`

Current `rateAura()` helper calls `/aura/rate` with auth. Add `rateAuraGuest()` that calls `/aura/rate-guest` without auth.

In the home screen's `takePhoto` / `pickImage` handler, branch on `useAuthStore((s) => s.user)`:
- Authed → `rateAura()` (existing flow, persists)
- Guest → `rateAuraGuest()` (ephemeral)

### 4.7 Guest session helper

**New file:** `app/src/lib/guestSession.ts`

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'guest_uploads_used';

export async function hasUsedFreeUpload(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY);
  return val === '1';
}

export async function markFreeUploadUsed(): Promise<void> {
  await AsyncStorage.setItem(KEY, '1');
}

export async function resetGuestState(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
```

Called from `authStore.signUp` success handler: `resetGuestState()`.

## 5. Architecture summary

```
Guest journey:
  App open → onboarding → home
    → tap Get Cooked → [hasUsedFreeUpload?]
       ├─ NO  → camera → /aura/rate-guest → show result → markFreeUploadUsed()
       └─ YES → <SignupSheet />

  → tap Your Aura / Battles → empty state + signup CTA → <SignupSheet /> or /auth/signup

  → tap Mog Board → leaderboard visible → tap row → <SignupSheet />

Authed journey: unchanged from today (full access, existing /aura/rate persists).
```

## 6. Files touched

**New:**
- `app/src/components/LensPicker.tsx`
- `app/src/components/SignupSheet.tsx`
- `app/src/lib/guestSession.ts`

**Modified:**
- `app/app/_layout.tsx` — route guard: drop !user redirect
- `app/app/(tabs)/index.tsx` — replace chip scroll with current-selection tile + LensPicker integration; branch aura submission on auth; wire SignupSheet on 2nd-tap
- `app/app/(tabs)/your-aura.tsx` — guest empty state
- `app/app/(tabs)/battles.tsx` — guest empty state
- `app/app/(tabs)/mogboard.tsx` — leave leaderboard visible; gate profile tap
- `app/src/lib/api.ts` — add `rateAuraGuest()`
- `app/src/store/authStore.ts` — call `resetGuestState()` on successful signup
- `server/src/routes/aura.ts` — add `POST /aura/rate-guest` handler

## 7. Risks & mitigations

- **Reinstall bypass:** user uninstalls → reinstalls → gets another free rating. IP rate-limit (3/day) catches obvious scrapers; genuine users reinstalling for a second try is acceptable leakage at pre-launch scale.
- **Guest hits the server hard:** the ephemeral rating still costs a Gemini API call. Rate-limit covers this; pre-launch volume is low. Can tighten to 1/IP/day if abuse emerges.
- **Lens picker modal on small screens:** 7 rows with descriptions may not fit on iPhone SE-class screens. The modal list is scrollable, so it degrades gracefully. Visual QA on the smallest target device before ship.
- **Guests see a "SIGN UP" CTA below ephemeral result → lose result on signup.** That's expected; the UI copy should say *"save your next one"* or similar, not imply the current result carries over.

## 8. Success criteria

- [ ] Fresh install on TestFlight → onboarding → home loads without auth
- [ ] Tap Get Cooked → photo flow → result renders from Gemini → AsyncStorage flag set
- [ ] Tap Get Cooked again → SignupSheet appears; no camera
- [ ] Sign up successfully → flag reset → full access restored
- [ ] Your Aura / Battles tabs show signup CTA as guest; show real content as user
- [ ] Mog Board row taps open signup sheet as guest; open profile as user
- [ ] Lens picker modal opens on tap; shows all 7 paths with descriptions; selection closes modal and updates home
- [ ] Path descriptions are readable; no text clipping on small screens
- [ ] Guest rate-limit: 4th call from same IP in 24h returns 429
