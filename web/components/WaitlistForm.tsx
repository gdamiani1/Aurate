'use client';

import { useState, type FormEvent } from 'react';
import { getSupabase } from '@/lib/supabase';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!consent) {
      setError('Tick the consent box to continue.');
      return;
    }
    setError(null);
    // Cycle 2 will wire this up.
    void getSupabase;
  }

  return (
    <form onSubmit={submit} noValidate className="font-body">
      <label className="block">
        <span className="block font-display uppercase tracking-wide">Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? 'true' : undefined}
          required
          className="w-full border-2 border-ink bg-cream px-3 py-2"
        />
      </label>
      <label className="mt-3 flex items-start gap-2">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>Notify me when Mogster launches. I can unsubscribe anytime.</span>
      </label>
      {error && (
        <p role="alert" className="mt-3 font-mono text-sm text-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="mt-4 w-full bg-ink px-4 py-3 font-display uppercase tracking-wide text-hazard-yellow"
      >
        LOCK ME IN →
      </button>
    </form>
  );
}
