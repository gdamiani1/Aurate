# Mogster Web — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship `mogster.app` (waitlist + privacy + terms + /auth/confirm) to unblock the app's broken legal links and email verification flow.

**Architecture:** Next.js 15 App Router site deployed to Vercel at `mogster.app`. Waitlist form inserts directly to a new Supabase `waitlist` table with RLS (anon can INSERT only). `/auth/confirm` is a client-side page that parses Supabase tokens from the URL hash and deep-links them into the Mogster app via the `mogster://` scheme. App-side changes: signUp passes `emailRedirectTo`, `_layout` handles the deep link, `openLink` surfaces errors instead of swallowing them.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, `@supabase/supabase-js`, Vitest + React Testing Library. Fonts: Anton + JetBrains Mono via `next/font/google`.

**Reference:** Design doc at `docs/plans/2026-04-18-mogster-web-design.md`.

---

## Task 1: Scaffold the Next.js project

**Files:**
- Create: `web/` directory with a minimal Next.js 15 App Router project

**Step 1: Run create-next-app in non-interactive mode**

```bash
cd /Users/grgurdamiani/Aurate
npx create-next-app@latest web \
  --typescript --tailwind --app --src-dir=false \
  --eslint --turbopack --import-alias="@/*" --no-git
```

Expected: creates `web/` with `app/page.tsx`, `app/layout.tsx`, `tailwind.config.ts`, `package.json`. No git init because we're in an existing repo.

**Step 2: Install extra deps**

```bash
cd web
npm install @supabase/supabase-js
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

**Step 3: Verify it boots**

```bash
npm run dev
```
Expected: `Local: http://localhost:3000` — kill it (Ctrl+C), don't need it yet.

**Step 4: Commit**

```bash
git add web/
git commit -m "chore(web): scaffold Next.js 15 project for mogster.app"
```

---

## Task 2: Configure Vitest and port the design tokens

**Files:**
- Create: `web/vitest.config.ts`
- Create: `web/vitest.setup.ts`
- Create: `web/lib/theme.ts`
- Modify: `web/tailwind.config.ts`
- Modify: `web/package.json` (add test script)

**Step 1: Port tokens from app**

Read `/Users/grgurdamiani/Aurate/app/src/constants/theme.ts` to grab the hazard-yellow, black, cream, and any accent color constants. Copy the relevant ones into `web/lib/theme.ts` as exported `as const` objects.

**Step 2: Extend Tailwind config**

In `web/tailwind.config.ts`, map the theme tokens into `theme.extend.colors` (e.g. `hazard-yellow`, `ink`, `cream`) so we can use `bg-hazard-yellow` etc. throughout the site.

**Step 3: Set up Vitest**

`web/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
});
```

`web/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

Add `"test": "vitest run"` to `web/package.json` scripts.

**Step 4: Smoke test runs clean**

```bash
cd web && npm test
```
Expected: "No test files found" — fine, we haven't written any yet.

**Step 5: Commit**

```bash
git add web/
git commit -m "chore(web): configure Vitest + port Mogster design tokens to Tailwind"
```

---

## Task 3: Set up Anton + JetBrains Mono fonts, global layout

**Files:**
- Modify: `web/app/layout.tsx`
- Modify: `web/app/globals.css`

**Step 1: Load fonts via next/font/google in `layout.tsx`**

```tsx
import { Anton, JetBrains_Mono, Inter } from 'next/font/google';

const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--font-anton' });
const jbmono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbmono' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${jbmono.variable} ${inter.variable}`}>
      <body className="font-[family-name:var(--font-inter)] bg-hazard-yellow text-ink">
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Add utility classes in `globals.css`**

```css
@theme {
  --font-display: var(--font-anton);
  --font-mono: var(--font-jbmono);
  --font-body: var(--font-inter);
}
```

**Step 3: Set the site metadata in `layout.tsx`**

```tsx
export const metadata = {
  title: 'Mogster — Your Aura. Rated. No Cap.',
  description: 'AI rates your aura. Chat roasts you. Join the waitlist.',
};
```

**Step 4: Commit**

```bash
git add web/
git commit -m "feat(web): wire Anton + JetBrains Mono + Inter fonts and global layout"
```

---

## Task 4: Build HazardStripe, GrainOverlay, Wordmark components

**Files:**
- Create: `web/components/HazardStripe.tsx`
- Create: `web/components/GrainOverlay.tsx`
- Create: `web/components/Wordmark.tsx`

These are visual-only, no tests — tests on static markup are low value.

**Step 1: HazardStripe**

A horizontal bar of black `◢◣` triangles on yellow, sized by `rem`. Accepts optional `label?: string` for centered text (e.g. "⚠ AURA MEASUREMENT STATION ⚠").

**Step 2: GrainOverlay**

Port the SVG/CSS noise approach from `app/src/components/design/GrainOverlay.tsx`. For web, use a tiled SVG `<feTurbulence>` filter rendered as a fixed-position `<div>` with `pointer-events-none` and `mix-blend-multiply` at ~8% opacity.

**Step 3: Wordmark**

The "MOGSTER" wordmark in Anton, all-caps, big. Reuse the app's letter-spacing/weight. Accepts optional `size?: 'sm' | 'lg'`.

**Step 4: Commit**

```bash
git add web/components/
git commit -m "feat(web): add HazardStripe, GrainOverlay, Wordmark components"
```

---

## Task 5: Supabase waitlist migration

**Files:**
- Create: `supabase/migrations/YYYYMMDDHHMMSS_waitlist.sql` (replace timestamp with current UTC, e.g. `20260418120000_waitlist.sql`)

**Step 1: Write the migration**

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

create policy "waitlist_insert_anon"
  on public.waitlist for insert
  to anon
  with check (true);
```

**Step 2: Apply it in Supabase**

If the user has `supabase` CLI linked:
```bash
supabase db push
```
Otherwise, paste the SQL into Supabase Dashboard → SQL Editor → Run. (Will be called out again in the user-action checklist at the end.)

**Step 3: Verify table exists and RLS is on**

In Supabase Dashboard → Database → Tables → waitlist: confirm the row exists and that RLS is enabled.

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add waitlist table with RLS insert-only policy"
```

---

## Task 6: Web Supabase client

**Files:**
- Create: `web/lib/supabase.ts`
- Create: `web/.env.local.example`

**Step 1: Write the client**

```ts
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: false }, // web site doesn't need auth sessions
});
```

**Step 2: Document env vars**

`web/.env.local.example`:
```
NEXT_PUBLIC_SUPABASE_URL=https://zyjndqfhueqxcbmtmdfc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same anon key used by the app>
```

**Step 3: Create actual `.env.local`** (not committed)

```bash
cp web/.env.local.example web/.env.local
# fill in the real anon key from app/src/lib/supabase.ts (already hardcoded there)
```

Make sure `.env.local` is in `web/.gitignore` (it is by default in Next.js scaffolds).

**Step 4: Commit**

```bash
git add web/lib/supabase.ts web/.env.local.example
git commit -m "feat(web): add Supabase client module"
```

---

## Task 7 (TDD): WaitlistForm — email validation

**Files:**
- Create: `web/components/__tests__/WaitlistForm.test.tsx`
- Create: `web/components/WaitlistForm.tsx`

**Step 1: Write the failing test**

```tsx
// web/components/__tests__/WaitlistForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WaitlistForm } from '../WaitlistForm';

describe('WaitlistForm', () => {
  it('shows an error when submitting an invalid email', async () => {
    const user = userEvent.setup();
    render(<WaitlistForm />);
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByLabelText(/notify me/i));
    await user.click(screen.getByRole('button', { name: /lock me in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd web && npm test
```
Expected: FAIL — `WaitlistForm` doesn't exist yet.

**Step 3: Write minimal WaitlistForm**

```tsx
// web/components/WaitlistForm.tsx
'use client';
import { useState } from 'react';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_RE.test(email)) { setError('Enter a valid email.'); return; }
    if (!consent) { setError('Consent required.'); return; }
    // TODO: submit to Supabase in next task
  };

  return (
    <form onSubmit={submit}>
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Notify me when Mogster launches. I can unsubscribe anytime.
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit">LOCK ME IN →</button>
    </form>
  );
}
```

**Step 4: Run test — should pass**

```bash
cd web && npm test
```
Expected: PASS.

**Step 5: Commit**

```bash
git add web/components/WaitlistForm.tsx web/components/__tests__/WaitlistForm.test.tsx
git commit -m "feat(web): WaitlistForm with client-side email + consent validation (TDD)"
```

---

## Task 8 (TDD): WaitlistForm — successful submission

**Files:**
- Modify: `web/components/__tests__/WaitlistForm.test.tsx`
- Modify: `web/components/WaitlistForm.tsx`

**Step 1: Add failing test for success state**

Mock the Supabase client module using `vi.mock`:

```tsx
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

it('shows success state after a valid submission', async () => {
  const user = userEvent.setup();
  render(<WaitlistForm />);
  await user.type(screen.getByLabelText(/email/i), 'me@example.com');
  await user.click(screen.getByLabelText(/notify me/i));
  await user.click(screen.getByRole('button', { name: /lock me in/i }));
  expect(await screen.findByText(/locked in/i)).toBeInTheDocument();
});
```

**Step 2: Run — fails**

```bash
cd web && npm test
```
Expected: FAIL — form doesn't submit anywhere yet.

**Step 3: Implement submission**

In `WaitlistForm.tsx`, replace the `TODO` with:

```tsx
import { supabase } from '@/lib/supabase';
// ... inside the component:
const [state, setState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

const submit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  if (!EMAIL_RE.test(email)) { setError('Enter a valid email.'); return; }
  if (!consent) { setError('Consent required.'); return; }
  setState('sending');
  const { error: dbError } = await supabase.from('waitlist').insert({
    email,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
  if (dbError) {
    // handled in next task
    setState('error');
    return;
  }
  setState('success');
};

if (state === 'success') {
  return (
    <div role="status">
      <p>☢ LOCKED IN ☢</p>
      <p>You're sigma. See you on launch day.</p>
    </div>
  );
}
```

**Step 4: Run — passes**

```bash
cd web && npm test
```

**Step 5: Commit**

```bash
git add web/components/
git commit -m "feat(web): WaitlistForm submits to Supabase and renders success state"
```

---

## Task 9 (TDD): WaitlistForm — duplicate email + network error

**Step 1: Add failing test for duplicate**

```tsx
it('shows "already on the list" when email is a duplicate', async () => {
  const { supabase } = await import('@/lib/supabase');
  vi.mocked(supabase.from).mockReturnValueOnce({
    insert: vi.fn(() => Promise.resolve({ error: { code: '23505', message: 'duplicate key' } })),
  } as any);
  // ... render, fill, submit ...
  expect(await screen.findByText(/already on the list/i)).toBeInTheDocument();
});

it('shows a retry message on network error', async () => {
  const { supabase } = await import('@/lib/supabase');
  vi.mocked(supabase.from).mockReturnValueOnce({
    insert: vi.fn(() => Promise.reject(new Error('network fail'))),
  } as any);
  // ... render, fill, submit ...
  expect(await screen.findByText(/try again/i)).toBeInTheDocument();
});
```

**Step 2: Run — fails**

**Step 3: Handle both cases in `WaitlistForm.tsx`**

Differentiate by `dbError.code === '23505'` (unique violation). Wrap the insert in try/catch to catch network-level rejections.

**Step 4: Run — passes**

**Step 5: Commit**

```bash
git add web/components/
git commit -m "feat(web): WaitlistForm handles duplicate-email and network errors"
```

---

## Task 10: Build `/` page

**Files:**
- Modify: `web/app/page.tsx`

**Step 1: Compose the page**

Layout:
1. `<HazardStripe label="⚠ AURA MEASUREMENT STATION ⚠" />`
2. Spacer
3. `<Wordmark size="lg" />`
4. Headline (Anton, big): `YOUR AURA. RATED. NO CAP.`
5. Pitch (Inter/mono): `AI rates your aura. Chat roasts you. Mog your friends on the leaderboard. TestFlight rolling out. App Store soon.`
6. `<WaitlistForm />`
7. `<HazardStripe />`
8. Footer: three links — `/privacy` · `/terms` · `mailto:support@mogster.app`
9. `<GrainOverlay />` as overlay (fixed, pointer-events-none)

Mobile-first, max-width ~600px centered, generous vertical spacing.

**Step 2: Eyeball in dev**

```bash
cd web && npm run dev
```
Open `http://localhost:3000`, verify layout. Kill server.

**Step 3: Commit**

```bash
git add web/app/page.tsx
git commit -m "feat(web): home page with hazard-screen waitlist layout"
```

---

## Task 11: Build `/privacy` page

**Files:**
- Create: `web/app/privacy/page.tsx`

**Step 1: Write the page**

Structure: slim HazardStripe → back link ("← MOGSTER" linking to `/`) → title "PRIVACY POLICY" (Anton) → cream-background reading panel with the drafted policy text.

Policy must cover, at minimum:
- Who (Grgur Damiani, Croatia, solo developer, contact: support@mogster.app)
- What is collected (email for waitlist + auth; selfies for aura; aura history; device/usage metadata via Supabase auth)
- Why (to provide the service)
- Who it's shared with (subprocessors: Supabase, Google Gemini, Upstash Redis, Railway, Cloudflare, Vercel)
- Retention (kept until account deletion or user requests)
- User rights (GDPR art. 15–22: access, deletion, portability, rectification, objection; CCPA: access, deletion, opt-out of sale — we don't sell)
- How to exercise rights (email support@mogster.app)
- Age: 13+
- Effective date: 2026-04-18

Draft readable English; no legalese padding.

**Step 2: Commit**

```bash
git add web/app/privacy/
git commit -m "feat(web): privacy policy page covering GDPR + CCPA"
```

---

## Task 12: Build `/terms` page

**Files:**
- Create: `web/app/terms/page.tsx`

Same visual structure as `/privacy`. Cover:
- Acceptance of terms
- "No harsh content" acceptable-use policy (no nudity, hate speech, harassment, illegal content in submitted selfies)
- Account termination for violations
- IP ownership (you own your uploads; Mogster owns the service)
- Liability limits and disclaimer of warranties
- Governing law: Croatia
- Contact: support@mogster.app

**Commit:**
```bash
git add web/app/terms/
git commit -m "feat(web): terms of service page"
```

---

## Task 13 (TDD): `/auth/confirm` token parsing

**Files:**
- Create: `web/app/auth/confirm/__tests__/parseTokens.test.ts`
- Create: `web/app/auth/confirm/parseTokens.ts`

Pull the token-parsing logic into a pure function so it can be tested without jsdom URL-hash gymnastics.

**Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { parseTokensFromHash } from '../parseTokens';

describe('parseTokensFromHash', () => {
  it('extracts access and refresh tokens', () => {
    const r = parseTokensFromHash('#access_token=abc&refresh_token=def&type=signup');
    expect(r).toEqual({ accessToken: 'abc', refreshToken: 'def' });
  });

  it('returns null if either token is missing', () => {
    expect(parseTokensFromHash('#access_token=abc')).toBeNull();
    expect(parseTokensFromHash('')).toBeNull();
  });
});
```

**Step 2: Fails**

**Step 3: Implement**

```ts
export function parseTokensFromHash(hash: string): { accessToken: string; refreshToken: string } | null {
  if (!hash || !hash.startsWith('#')) return null;
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}
```

**Step 4: Passes**

**Step 5: Commit**

```bash
git add web/app/auth/confirm/
git commit -m "feat(web): parseTokensFromHash helper for /auth/confirm (TDD)"
```

---

## Task 14: Build `/auth/confirm` page

**Files:**
- Create: `web/app/auth/confirm/page.tsx`

**Step 1: Implement**

```tsx
'use client';
import { useEffect, useState } from 'react';
import { parseTokensFromHash } from './parseTokens';

export default function ConfirmPage() {
  const [showFallback, setShowFallback] = useState(false);
  const [deepLink, setDeepLink] = useState<string>('mogster://');

  useEffect(() => {
    const tokens = parseTokensFromHash(window.location.hash);
    if (tokens) {
      const url = `mogster://auth/callback#access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`;
      setDeepLink(url);
      window.location.href = url;
    }
    const t = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <main>
      <HazardStripe label="⚠ EMAIL CONFIRMED ⚠" />
      <h1>LAUNCHING APP...</h1>
      {showFallback && (
        <>
          <a href={deepLink}>OPEN MOGSTER APP →</a>
          <p>Install the app from TestFlight / App Store if nothing happened.</p>
        </>
      )}
    </main>
  );
}
```

**Step 2: Commit**

```bash
git add web/app/auth/confirm/
git commit -m "feat(web): /auth/confirm deep-links into app with 3s fallback"
```

---

## Task 15: App — signUp passes `emailRedirectTo`

**Files:**
- Modify: `app/src/store/authStore.ts` around line 42

**Step 1: Update the call**

```ts
signUp: async (email, password, username) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: 'https://mogster.app/auth/confirm',
    },
  });
  // ...rest unchanged
},
```

**Step 2: Typecheck**

```bash
cd /Users/grgurdamiani/Aurate/app && npx tsc --noEmit
```
Expected: no errors.

**Step 3: Commit**

```bash
git add app/src/store/authStore.ts
git commit -m "fix(app): pass emailRedirectTo to supabase.signUp → mogster.app/auth/confirm"
```

---

## Task 16: App — deep-link handler in `_layout.tsx`

**Files:**
- Modify: `app/app/_layout.tsx`

**Step 1: Add a useEffect that listens for incoming `mogster://auth/callback` URLs**

```tsx
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

// inside the root layout component:
useEffect(() => {
  const handleUrl = async (url: string) => {
    const parsed = Linking.parse(url);
    if (parsed.hostname !== 'auth' || parsed.path !== 'callback') return;
    const { queryParams } = parsed;
    const accessToken = queryParams?.access_token as string | undefined;
    const refreshToken = queryParams?.refresh_token as string | undefined;
    if (!accessToken || !refreshToken) return;
    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  };

  // Cold start: app opened via the link
  Linking.getInitialURL().then((u) => { if (u) handleUrl(u); });

  // Warm: app already running
  const sub = Linking.addEventListener('url', (e) => handleUrl(e.url));
  return () => sub.remove();
}, []);
```

**Note on URL format:** Supabase includes tokens in the URL hash on web (`#access_token=...`), but `Linking.parse` will put them in `queryParams` when the scheme URL is `mogster://auth/callback?access_token=...`. `/auth/confirm` uses `?` when building the deep link (see Task 14). If tokens arrive in `parsed.path` fragment instead, adjust accordingly — this is the one thing to verify live.

**Step 2: Typecheck**

```bash
cd app && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add app/app/_layout.tsx
git commit -m "feat(app): handle mogster://auth/callback deep link in root layout"
```

---

## Task 17: App — improve `openLink` to surface errors

**Files:**
- Modify: `app/app/(tabs)/your-aura.tsx` around line 173

**Step 1: Replace silent catch with haptic + alert**

```ts
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';

const openLink = async (url: string) => {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) throw new Error(`Cannot open ${url}`);
    await Linking.openURL(url);
  } catch (err) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert('Cannot open link', `We couldn't open that page. Try again in a bit.`);
  }
};
```

**Step 2: Typecheck**

**Step 3: Commit**

```bash
git add app/app/(tabs)/your-aura.tsx
git commit -m "fix(app): openLink surfaces errors with haptic + alert instead of swallowing"
```

---

## Task 18: Deploy web to Vercel (user action, documented)

**User does these from their machine (not Claude):**

**Step 1:** `cd web && npx vercel` → follow the wizard. Use Grgur's Vercel account, project name `mogster-web`, framework auto-detects Next.js. `npx vercel --prod` after the preview works.

**Step 2:** In the Vercel dashboard → this project → Settings → Environment Variables, add:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://zyjndqfhueqxcbmtmdfc.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (paste the anon key from `app/src/lib/supabase.ts`)

Redeploy.

**Step 3:** In Vercel → Settings → Domains → add `mogster.app`. Vercel shows two DNS records to add at Cloudflare.

---

## Task 19: Cloudflare DNS + Email Routing (user action)

**Cloudflare dashboard → `mogster.app` zone:**

**Step 1 — DNS for Vercel:** Add the `A`/`CNAME` records Vercel gave you in Task 18. Set proxy status to DNS-only (gray cloud) initially — Vercel's automatic SSL won't provision through Cloudflare's proxy on first setup; re-enable proxy later if desired.

**Step 2 — Email Routing:** Cloudflare → Email → Email Routing → Get started. It auto-configures MX records. Add a custom address rule: `support@mogster.app` → forward to `grgur.apple@gmail.com`. Verify the destination by clicking the email Cloudflare sends.

**Step 3 — Verify:** From any other email, send a message to `support@mogster.app`. Confirm it arrives in `grgur.apple@gmail.com`.

---

## Task 20: Supabase dashboard config (user action)

**Supabase Dashboard → Project → Authentication:**

**Step 1:** URL Configuration → **Site URL** = `https://mogster.app/auth/confirm`

**Step 2:** URL Configuration → **Additional Redirect URLs** — add both:
- `https://mogster.app/auth/confirm`
- `mogster://**`

**Step 3:** SQL Editor → paste and run the content of the waitlist migration (Task 5) if `supabase db push` wasn't used.

---

## Task 21: End-to-end verification checklist

Go through these in order. If any fails, stop and diagnose before continuing.

- [ ] `https://mogster.app` resolves and shows the waitlist page over HTTPS
- [ ] Tapping `PRIVACY` in the app opens `https://mogster.app/privacy` and the page renders correctly
- [ ] Tapping `TERMS` opens `/terms` correctly
- [ ] Tapping `SUPPORT` opens an email composer to `support@mogster.app`
- [ ] A fresh sign-up in the app triggers a verification email whose link points to `https://mogster.app/auth/confirm#…`
- [ ] Tapping that link on the same iPhone opens Mogster, session is established (user is signed in without re-entering password)
- [ ] Submitting a new email on the waitlist form shows the `LOCKED IN` state, and the row appears in Supabase's `waitlist` table
- [ ] Submitting the same email again shows the duplicate message
- [ ] Sending an email to `support@mogster.app` lands in `grgur.apple@gmail.com`

If everything passes, push:

```bash
git push origin master
```

---

## Follow-ups (out of scope for this plan — spawn as separate tasks)

- Universal Links / App Links (Phase B) — upload `apple-app-site-association` + `.well-known/assetlinks.json` so `/auth/confirm` opens the app natively without the visible web bounce
- Resend integration for broadcast emails when Mogster launches
- Marketing homepage (Phase B) — screenshots, pitch video, App Store badges
- Undo the hardcoded Supabase/API URLs in `app/src/lib/supabase.ts` and `api.ts` once EAS env vars are fixed (already tracked as a spawned task earlier this session)
