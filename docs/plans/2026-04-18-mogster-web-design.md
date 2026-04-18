# Mogster Web (mogster.app) — Design Doc

**Date:** 2026-04-18
**Author:** Grgur Damiani (with Claude)
**Status:** Approved — ready for implementation plan

## 1. Goal

Unblock two bugs in the Mogster mobile app:

1. **Bug 1:** Privacy / Terms / Support links in `your-aura.tsx` point at `https://mogster.app/*`, which doesn't resolve (NXDOMAIN). Tapping them opens "something random" (browser error / DNS suggestion page).
2. **Bug 2:** `supabase.auth.signUp` in `authStore.ts` is called without `emailRedirectTo`, so the verification email falls back to whatever default Site URL is configured in the Supabase dashboard.

Secondary goal: establish a pre-launch **waitlist** on `mogster.app` to collect email addresses from interested users while the app is TestFlight-only.

## 2. Scope

**In scope (Phase A — this doc):**
- `/` — waitlist page
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/auth/confirm` — Supabase email-verification landing + deep-link to app
- App-side code changes (signUp `emailRedirectTo`, deep-link handler, better error surfacing)
- Cloudflare DNS + Email Routing
- Supabase dashboard config
- Vercel deploy

**Out of scope (Phase B — later):**
- Marketing content, screenshots, App Store / TestFlight embed
- Universal Links / App Links (verified domain association for iOS/Android)
- Sending confirmation / welcome emails (Resend etc.)
- Double opt-in (GDPR gold standard but not strictly required for a notification-only waitlist with clear consent)
- User portal (web access to aura history, etc.)

## 3. Aesthetic

Hazard-screen brutalist, continuous with the Mogster app's visual identity:

- **Colors:** hazard yellow background (reuse `app/src/constants/theme.ts`), black diagonal stripes, cream/off-white reading panels for long text
- **Type:** Anton for display / headlines (reuse `@expo-google-fonts/anton` equivalent in web — `next/font/google`), JetBrains Mono for the small/technical type, system/Inter for body copy on legal pages
- **Texture:** grain overlay matching the app's `GrainOverlay` component (a tiled SVG or PNG noise)
- **Motif:** `⚠`, `◢◣` caution stripes, `☢`, all-caps headers, chunky borders

## 4. Pages

### 4.1 `/` — Waitlist

Single-scroll, no nav, mobile-first. Hazard-stripe header bar → Mogster wordmark → headline → pitch → email form + consent checkbox + submit button → success state replaces form in place. Footer: `PRIVACY · TERMS · SUPPORT`.

**Headline:** `YOUR AURA. RATED. NO CAP.` (or a user-chosen alternate from the options surfaced during brainstorming)

**Pitch:** `AI rates your aura. Chat roasts you. Mog your friends on the leaderboard. TestFlight rolling out. App Store soon.`

**Button:** `LOCK ME IN →`

**Consent checkbox (legally clean, required for GDPR):** `Notify me when Mogster launches. I can unsubscribe anytime.`

**Success state (swaps form in place):**
```
☢  LOCKED IN  ☢
You're sigma.
See you on launch day.
```

**Error handling:**
- Invalid email → inline validation message, no submission
- Unique-constraint violation → *"you're already on the list — see you soon"*
- Network / other → *"something went sideways. try again."* + retry button

### 4.2 `/privacy`

Slim hazard-stripe header, back link to `/`, cream reading panel over yellow background, Anton title, Inter 16px body. Content drafted for:
- Solo developer (Grgur Damiani, Croatia)
- Users in EU + US
- GDPR + CCPA compliance language
- Data types collected: email (waitlist), email + auth (Supabase auth), selfie images (for aura rating), aura history rows
- Subprocessors: Supabase (Auth, DB, Storage), Google Gemini (AI), Upstash Redis (rate limit), Railway (API hosting), Cloudflare (DNS + email forwarding), Vercel (web hosting)
- Data rights: access, deletion, portability, rectification; contact `support@mogster.app`
- Age restriction: 13+ (or 16+ if we choose to align with stricter EU baseline — to decide)

### 4.3 `/terms`

Same chrome as `/privacy`. Content: acceptable use, "no harsh content" policy, account termination, IP ownership, liability limits, governing law (Croatia), contact.

### 4.4 `/auth/confirm`

Minimal page, hazard-styled. Client-side JavaScript:
1. Parse `access_token` + `refresh_token` from the URL hash (`window.location.hash`)
2. Immediately: `window.location.href = "mogster://auth/callback#access_token=…&refresh_token=…"`
3. Display: `⚠ EMAIL CONFIRMED ⚠` → `LAUNCHING APP...`
4. After 3s, reveal fallback button: `OPEN MOGSTER APP →` (links to `mogster://`) + note: *"Install the app from TestFlight / App Store if nothing happened."*

## 5. Tech stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** (matches Expo's `expo-tailwind-setup` skill guidance for token parity)
- **`@supabase/supabase-js`** for waitlist insert
- Deployed on **Vercel**, domain `mogster.app`
- No custom backend — direct Supabase insert with RLS

## 6. Project layout

```
/Users/grgurdamiani/Aurate/
├── app/                    ← existing Expo app
├── server/                 ← existing Fastify server
├── supabase/               ← existing migrations
├── web/                    ← NEW: Next.js site (this doc)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  → /
│   │   ├── privacy/page.tsx          → /privacy
│   │   ├── terms/page.tsx            → /terms
│   │   └── auth/
│   │       └── confirm/page.tsx      → /auth/confirm
│   ├── components/
│   │   ├── HazardStripe.tsx
│   │   ├── GrainOverlay.tsx
│   │   ├── WaitlistForm.tsx
│   │   └── Wordmark.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── theme.ts                   (ported tokens from app/src/constants/theme.ts)
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── docs/
└── ...
```

`web/` is deployed as its own Vercel project — no monorepo workspace config needed.

## 7. Data model

### `supabase/migrations/YYYYMMDDHHMMSS_waitlist.sql`

```sql
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text default 'mogster.app',
  user_agent text,
  created_at timestamptz default now(),
  constraint waitlist_email_unique unique (email),
  constraint waitlist_email_valid check (email ~ '^[^@]+@[^@]+\.[^@]+$')
);

alter table public.waitlist enable row level security;

-- anon role can INSERT only; no SELECT/UPDATE/DELETE via anon or authenticated
create policy "waitlist_insert_anon"
  on public.waitlist for insert
  to anon
  with check (true);
```

Reads are via Supabase dashboard SQL editor or service-role key only. No way to scrape the list through the public API.

## 8. Data flow

### Waitlist submission
```
User types email, checks consent, clicks submit
  ↓
Client JS (WaitlistForm.tsx): validate email regex + consent
  ↓
supabase.from('waitlist').insert({ email, user_agent: navigator.userAgent })
  ↓
success  → swap form for "LOCKED IN" success state
unique-conflict → show "already on the list"
other error → show retry
```

### Email verification (`/auth/confirm`)
```
User signs up in app → Supabase sends email with link to
  https://mogster.app/auth/confirm#access_token=…&refresh_token=…

User taps link on phone:
  Email client opens https://mogster.app/auth/confirm#…
    ↓
  Next.js page loads, reads hash params
    ↓
  window.location = "mogster://auth/callback#access_token=…&refresh_token=…"
    ↓
  iOS/Android launches Mogster app
    ↓
  app/_layout.tsx deep-link handler parses the URL, calls
    supabase.auth.setSession({ access_token, refresh_token })
    ↓
  session active — user lands in the app, signed in and verified
```

If the link is opened on a desktop / a device without the app: the `mogster://` navigation fails silently, the 3-second fallback button appears, user can install the app.

## 9. App-side changes

All in the Expo app (`app/`):

1. **`app/src/store/authStore.ts`** — update `signUp`:
   ```ts
   await supabase.auth.signUp({
     email,
     password,
     options: {
       data: { username, display_name: username },
       emailRedirectTo: "https://mogster.app/auth/confirm",
     },
   });
   ```

2. **`app/app/_layout.tsx`** — add deep-link handler that on `mogster://auth/callback` parses tokens from the URL and calls `supabase.auth.setSession(...)`. Use `expo-linking` + `expo-router`.

3. **`app/app/(tabs)/your-aura.tsx`** — improve `openLink` to surface errors (e.g., a brief haptic + toast) instead of silently swallowing them. Defense in depth — so broken URLs never fail invisibly again.

## 10. Setup steps (user performs these)

**Cloudflare Registrar (where the domain lives):**
- Email → Email Routing → Enable → rule: `support@mogster.app` → `grgur.apple@gmail.com`
- DNS: add records that Vercel provides when `mogster.app` is added as a Vercel domain

**Supabase dashboard:**
- Authentication → URL Configuration → Site URL: `https://mogster.app/auth/confirm`
- Authentication → URL Configuration → Additional Redirect URLs: `https://mogster.app/auth/confirm`, `mogster://**`
- SQL Editor → run the waitlist migration

**Vercel:**
- Create new project pointed at `web/`, deploy
- Project → Settings → Domains → add `mogster.app`

**Env vars (Vercel project settings):**
- `NEXT_PUBLIC_SUPABASE_URL` = same as app
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = same as app (already RLS-protected)

## 11. Success criteria

- Tapping PRIVACY / TERMS / SUPPORT in the app opens the real respective page (no more "something random")
- Sign up with a new email → verification link arrives → tap link on phone → app opens, user is verified and signed in
- Waitlist form on `mogster.app` submits successfully; `SELECT count(*) FROM waitlist` in Supabase reflects the insert; duplicate email shows the "already on the list" state
- Vercel shows `mogster.app` as a live custom domain with valid HTTPS
- Cloudflare Email Routing forwards `support@mogster.app` → `grgur.apple@gmail.com` (test by sending a message)

## 12. Risks / things to watch

- **`mogster://` deep link on iOS** requires the app to be installed. Until TestFlight rollout is wide, most recipients won't have the app — fallback button + install instructions cover this.
- **Universal Links not yet set up.** Users will briefly see `/auth/confirm` in a browser tab before the app opens. Acceptable for Phase A; upgrade in Phase B.
- **Tailwind v4** is relatively new; if it introduces friction, we can fall back to v3 without impacting the rest of the design.
- **Anton font license** — free via Google Fonts, OK to use commercially.
- **GDPR double opt-in** — single opt-in with clear consent text is defensible for a notification-only waitlist, but a regulator could push back. Risk low; if needed, upgrade to double opt-in in Phase B via Resend.
