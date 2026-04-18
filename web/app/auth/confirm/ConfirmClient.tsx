'use client';

import { useEffect, useState } from 'react';
import { parseTokensFromHash } from './parseTokens';
import HazardStripe from '@/components/HazardStripe';
import GrainOverlay from '@/components/GrainOverlay';

/**
 * Client-side landing page for Supabase email confirmation links.
 *
 * Supabase sends users here with tokens in the URL hash:
 *   https://mogster.app/auth/confirm#access_token=…&refresh_token=…
 *
 * On mount we:
 *   1. Parse the tokens.
 *   2. Immediately redirect to a `mogster://auth/callback#…` deep-link so the
 *      app takes over if it's installed.
 *   3. After 3s, if the user is still here (no app / desktop), reveal a
 *      fallback button + install hint.
 *
 * Rendering is staged behind a `mounted` flag so the initial client render
 * matches the SSR shell (GrainOverlay + HazardStripe) and we avoid a
 * hydration mismatch on the state-driven inner content.
 */
export default function ConfirmClient() {
  const [mounted, setMounted] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tokens = parseTokensFromHash(window.location.hash);
    if (!tokens) {
      setError(true);
      // No deep-link to try, so skip the 3s wait and show the message now.
      setShowFallback(true);
      return;
    }
    const url = `mogster://auth/callback#access_token=${encodeURIComponent(
      tokens.accessToken,
    )}&refresh_token=${encodeURIComponent(tokens.refreshToken)}`;
    setDeepLink(url);
    // Hand off to the app immediately. If it's installed, this navigates
    // away; if not, the browser stays put and our 3s fallback fires.
    window.location.href = url;
    const t = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Pre-mount shell — matches what SSR would render, so hydration is clean.
  if (!mounted) {
    return (
      <main className="relative min-h-screen bg-hazard-yellow flex flex-col">
        <GrainOverlay />
        <HazardStripe height="md" label="⚠ EMAIL CONFIRMED ⚠" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-hazard-yellow flex flex-col">
      <GrainOverlay />
      <HazardStripe height="md" label="⚠ EMAIL CONFIRMED ⚠" />

      <div className="relative z-10 flex-1 px-6 pt-16 pb-12 md:pt-24">
        <div className="mx-auto w-full max-w-xl text-center">
          {error ? (
            <>
              <h1
                className="font-display text-5xl md:text-6xl text-ink tracking-tight leading-none uppercase"
              >
                ⚠ INVALID LINK ⚠
              </h1>
              <p
                role="status"
                aria-live="polite"
                className="mt-6 font-mono text-base md:text-lg text-ink"
              >
                This link is missing the verification tokens. Check your email
                for a fresh verification link.
              </p>
              <a
                href="/"
                className="mt-10 inline-block w-full max-w-md bg-ink px-4 py-3 font-display uppercase tracking-wide text-hazard-yellow"
              >
                ← BACK TO MOGSTER
              </a>
            </>
          ) : (
            <>
              <h1 className="font-display text-5xl md:text-6xl text-ink tracking-tight leading-none uppercase">
                LAUNCHING APP...
              </h1>
              <p
                role="status"
                aria-live="polite"
                className="mt-6 font-mono text-base md:text-lg text-ink"
              >
                Redirecting you back to Mogster.
              </p>

              {showFallback && deepLink && (
                <div className="mt-10">
                  <a
                    href={deepLink}
                    className="inline-block w-full max-w-md bg-ink px-4 py-3 font-display uppercase tracking-wide text-hazard-yellow"
                  >
                    OPEN MOGSTER APP →
                  </a>
                  <p className="mt-4 font-mono text-sm text-ink">
                    Didn&apos;t open? Install Mogster from TestFlight / App
                    Store and try again.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
