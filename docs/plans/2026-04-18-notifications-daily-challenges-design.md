# Notifications + Daily Challenges — Design Doc

**Date:** 2026-04-18
**Author:** Grgur Damiani (with Claude)
**Status:** Approved — ready for implementation plan

## 1. Goal

Add push + local notifications so Mogster has a retention loop, and finish building the half-stubbed Daily Challenges feature so one of those notifications points at something real.

## 2. Scope (combined because the notification and the feature are interdependent)

**In scope:**
- Five notification types (daily reminder, streak saver, battle accepted, friend request, daily challenge available)
- Daily challenge banner on the Home tab with completion state
- Aura endpoint applies the daily challenge `bonus_multiplier` when the submission's `sigma_path` matches today's challenge
- `challenge_completed` tracking on `aura_checks`
- Push token registration + storage
- Permission primer screen after onboarding
- Settings toggle to enable/disable notifications
- Deep-link routing from notification taps

**Out of scope (deliberately):**
- Multi-device support (one push token per user)
- Per-category notification preferences (master toggle only)
- Timezone-aware daily challenge broadcast (fixed 18:00 UTC)
- Quiet hours / DND awareness beyond OS defaults
- Rich notification images
- In-app notification inbox
- Daily challenge completion streak (separate from existing login streak)
- Android-specific FCM customization (Expo Push handles both platforms)
- Cleanup of the unused `daily_challenges` DB table (separate follow-up)

## 3. Notification types

| # | Type | Trigger | Delivery | Copy |
|---|---|---|---|---|
| 1 | Daily aura check | 18:00 device-local, repeats | Local (`expo-notifications`) | "Your aura is rotting. 📸 Tap in and get rated before midnight." |
| 2 | Streak saver | 22:00 device-local, only if no check-in today and streak ≥ 3 | Local (conditional schedule) | "🔥 Your N-day streak dies at midnight. Two hours to save it." |
| 3 | Battle accepted | `POST /battles/:id/accept` fires | Server push | "{opponent} accepted your battle. Go see who mogged harder." |
| 4 | Friend request | `POST /friends/request` fires | Server push | "{requester} wants to join your circle. Accept or decline in Battles." |
| 5 | Daily challenge | 18:00 UTC daily cron | Server push | "Today's challenge: {title}. +{bonus}× bonus aura if you pass." |

Deep-links embedded via the notification `data.url` field:
- Battle accepted → `mogster://battles/reveal/{battleId}`
- Friend request → `mogster://battles` (friends section lives in that tab)
- Daily challenge → `mogster://` (home; banner is prominent)

## 4. Architecture

### 4.1 New database objects

Migration `supabase/migrations/004_notifications_and_challenges.sql`:

```sql
-- Push tokens: one row per user (pre-launch scale; multi-device is a later concern)
create table public.push_tokens (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios', 'android')),
  updated_at timestamptz default now()
);

alter table public.push_tokens enable row level security;

create policy "push_tokens_self"
  on public.push_tokens for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Track which aura_checks qualified for today's daily challenge
alter table public.aura_checks
  add column challenge_completed boolean not null default false;
```

Daily-challenge definitions stay in code (`server/src/routes/daily.ts` hardcoded array). The unused `daily_challenges` DB table is left alone for now.

### 4.2 Server-side components

**New module: `server/src/lib/push.ts`**
- `sendPush(userId, { title, body, data? })` — looks up `push_tokens`, POSTs to `https://exp.host/--/api/v2/push/send`, handles `DeviceNotRegistered` (delete token) and rate-limit retries
- Fire-and-forget from route handlers; wrapped in try/catch; errors logged via Pino

**New routes:**
- `POST /push/register` — accepts `{ expo_push_token, platform }`, upserts `push_tokens` row for the authenticated user
- `POST /push/unregister` — deletes the authenticated user's `push_tokens` row
- `POST /cron/daily-challenge-announce` — called by Vercel Cron at 18:00 UTC; verifies shared-secret header; iterates `push_tokens` and pushes the day's challenge to each user

**Modified routes:**
- `POST /aura/rate` — after AI scoring, check if today's challenge `sigma_path` is `null` (wildcard) or matches `submission.sigma_path`. If yes: apply `bonus_multiplier`, mark `challenge_completed=true` on the inserted `aura_checks` row
- `POST /battles/:id/accept` — after DB write, fire-and-forget `sendPush(battle.challenger_id, ...)`
- `POST /friends/request` — after DB write, fire-and-forget `sendPush(recipient_id, ...)`

### 4.3 Scheduler — Vercel Cron

Added to `web/vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-challenge",
      "schedule": "0 18 * * *"
    }
  ]
}
```

A tiny Next.js API route in `web/app/api/cron/daily-challenge/route.ts` verifies the `CRON_SECRET` header from Vercel, then POSTs to the Fastify server's `/cron/daily-challenge-announce` with its own server-to-server secret.

Why Vercel Cron: free on the Hobby plan, colocates with existing infrastructure, straightforward retries. QStash considered but overkill for one daily job.

### 4.4 App-side components

**New dependency:** `expo-notifications`. Adding it requires a new native build — the next EAS submission.

**`app.json` additions:**
- Plugin config:
  ```json
  "plugins": [
    ["expo-notifications", { "icon": "./assets/images/notification-icon.png", "color": "#FFD60A" }]
  ]
  ```
- iOS background modes: `["remote-notification"]`

**Permission primer:** new screen in `app/onboarding/notifications.tsx` or inline at end of onboarding flow. Explains why notifications, then tap → iOS permission prompt → token captured → `POST /push/register`. "Maybe later" sets a local AsyncStorage flag delaying re-prompt 14 days.

**Token registration logic:** `app/src/lib/notifications.ts` (new):
- `registerForPushNotificationsAsync()` — calls `Notifications.getPermissionsAsync()`, requests if undetermined, fetches `ExpoPushToken`, returns it
- Invoked from `_layout.tsx` after user is authenticated; posts token to `/push/register` if changed
- On permission-denied, calls `/push/unregister`

**Local schedules:** `app/src/lib/notifications.ts`:
- `scheduleDailyReminder()` — `Notifications.scheduleNotificationAsync({ trigger: { hour: 18, minute: 0, repeats: true }})`
- `scheduleStreakSaver()` — scheduled each time user completes a daily check-in; computes tomorrow 22:00 local, writes notification. Canceled + rescheduled if a new check-in happens.
- `cancelAllLocal()` — called when user flips the Settings toggle to off

**Deep-link extension in `_layout.tsx`:** existing `Linking` handler extended with a sibling `Notifications.addNotificationResponseReceivedListener` that reads `response.notification.request.content.data.url` and routes through the same function.

**Daily challenge banner:** new component `app/src/components/daily/DailyChallengeBanner.tsx`, rendered at top of `app/(tabs)/index.tsx`:
- Fetches `GET /daily/today` on mount (cache ~1 hr)
- States: `unstarted` / `completed`
- Layout: ink card, hazard-yellow border accent, title (font-display), description (font-mono), `+{multiplier}× AURA` badge
- When aura submission with matching `sigma_path` completes, banner switches to `completed` showing the bonus-multiplied score

**Settings toggle** in `app/(tabs)/your-aura.tsx` — single row: `NOTIFICATIONS`. Toggle state = `Notifications.getPermissionsAsync()` granted AND local-enabled flag. Turning off calls `cancelAllLocal()` + `/push/unregister`; turning on triggers permission prompt if needed.

## 5. Flows end-to-end

### 5.1 User signs up → notifications on
1. Existing onboarding completes
2. Permission primer screen shown
3. User taps Allow → iOS prompt → grants → token returned
4. App POSTs `/push/register` with `{ expo_push_token, platform }`
5. App schedules local daily reminder (6pm) locally

### 5.2 User submits aura on Wildcard Wednesday
1. User picks any sigma path, submits selfie
2. `POST /aura/rate` runs Gemini, gets base score
3. Server checks day-of-week rotation → sees today is Wildcard Wednesday, `sigma_path: null`, `bonus_multiplier: 2.0`
4. Multiplier applied: final score = base × 2.0
5. Row inserted into `aura_checks` with `challenge_completed=true`
6. Server schedules local streak-saver for tomorrow 22:00 (via response metadata picked up by app)
7. App's daily challenge banner updates to completed state

### 5.3 User challenges a friend
1. Challenger submits battle to friend (existing flow)
2. Friend's device gets push "X accepted your battle" via server push
3. Friend taps notification
4. OS opens Mogster via deep-link → `_layout.tsx` listener reads `mogster://battles/reveal/{id}` → router navigates to battle reveal screen

### 5.4 Daily challenge broadcast
1. Vercel Cron fires at 18:00 UTC
2. Request POSTs to Fastify `/cron/daily-challenge-announce` with shared secret
3. Handler fetches today's challenge, queries all `push_tokens`
4. Sends individual push to each opted-in user
5. Users see "Today's challenge: X" notification
6. Tap → home tab opens → banner visible

## 6. Permissions UX

- Permission requested **after onboarding completes** (not at first launch) so user has seen the app before being asked
- Primer screen (one page, hazard aesthetic) explains value before the iOS modal appears — boosts grant rate from ~40% (cold prompt) to ~70% (primed)
- "Maybe later" sets AsyncStorage flag `notification_primer_declined_at` → don't re-prompt for 14 days
- If user denies at OS level, app doesn't nag but exposes the toggle in Settings

## 7. Error handling

- **Expo Push returns `DeviceNotRegistered`:** server deletes that user's `push_tokens` row, logs Pino warning
- **Push API rate-limited:** one retry with 1s backoff; if still failing, log and drop (not user-facing)
- **Push API down entirely:** errors swallowed (fire-and-forget), route handler's primary work (accept battle, create friend request) still succeeds
- **`/push/register` fails from app:** retry once on next app foreground; never block user flow
- **Vercel Cron misses:** Vercel auto-retries; on repeated failure, alert goes to user's Vercel dashboard email

## 8. Testing strategy

**Unit tests (server):**
- `push.ts` — mock fetch; verify `sendPush` calls the Expo endpoint with the right body, handles `DeviceNotRegistered` by deleting token
- `/aura/rate` bonus application — table test covering each day's `sigma_path` matched and not matched
- `/cron/daily-challenge-announce` — mock token query + push calls; verify shared-secret check rejects without header

**Unit tests (app):**
- `notifications.ts` — mock `expo-notifications` APIs; verify permission flow, token registration error handling, local schedule helpers

**Manual verification:**
- Accept a battle from TestFlight device A; device B receives push; tap opens reveal screen
- Send friend request from A to B; B receives push; tap opens friends
- Wait (or mock) until 18:00 UTC; all test devices receive daily challenge push
- Complete aura submission on Wildcard Wednesday with any path; verify bonus applied in response; banner switches to completed
- Flip Settings toggle off → send test event → no push arrives

## 9. Rollout

This feature ships in a **new EAS build** because `expo-notifications` is a native module. Before the build:
1. Migration applied to Supabase
2. Fastify server deployed with new routes
3. Vercel cron set up in `web/vercel.json` and `CRON_SECRET` added to Vercel env
4. Server's shared secret added to Fastify env

Once those are in place, EAS build + submit, new TestFlight version rolls out. Local notifications start scheduling on-install; server-pushed events start working immediately after the first app launch with push permission granted.

## 10. Success criteria

- [ ] Fresh install → onboarding → primer → iOS prompt → permission granted → `push_tokens` row exists
- [ ] Toggle off in Settings → row deleted, local schedules cleared
- [ ] Daily reminder fires at 18:00 local on a test device
- [ ] Streak saver fires at 22:00 when streak ≥ 3 and no check-in
- [ ] Battle accepted on device A → push received on device B within 10s
- [ ] Friend request created for B → push received on B within 10s
- [ ] 18:00 UTC cron fires → push received by every opted-in user within 60s
- [ ] Aura submission on Wildcard Wednesday with `mogger_mode` → score × 2.0 applied, `challenge_completed=true`, banner shows completed state
- [ ] Tap daily-challenge push → opens home tab with banner visible
- [ ] All server unit tests green
- [ ] All app unit tests green
