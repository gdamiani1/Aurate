import type { Metadata } from 'next';
import HazardStripe from '@/components/HazardStripe';
import GrainOverlay from '@/components/GrainOverlay';
import GlitchWordmark from '@/components/GlitchWordmark';
import MarqueeStripe from '@/components/MarqueeStripe';

export const metadata: Metadata = {
  title: 'Support',
  description:
    "Get help with Mogster. Email-only support, 48-hour response, real human (the founder).",
  alternates: { canonical: '/support' },
};

const MARQUEE_ITEMS = [
  'SUPPORT STATION',
  'INCOMING TRANSMISSION',
  'WE READ EVERY EMAIL',
  '48 HOUR RESPONSE',
  'NO BOTS NO TICKETS',
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "I can't sign in / my password isn't working",
    a: 'Try password reset from the sign-in screen first. If that fails, email us with the email address on the account.',
  },
  {
    q: "I'm under 16 — can I still use Mogster?",
    a: "Not yet. Mogster is 16+. We don't serve minors, with or without parental consent. Come back when you're cooking.",
  },
  {
    q: 'My selfie keeps getting rejected',
    a: 'Different lighting / angle usually fixes it. If you keep getting rejected, email us with details and we\'ll review the account.',
  },
  {
    q: 'My account is locked / says "under review"',
    a: 'Email help@mogster.app from the email on the account. We\'ll review and respond within 48 hours.',
  },
  {
    q: 'A roast crossed a line',
    a: 'We screen output, but the system is unhinged on purpose. If a roast attacks specific physical features or anything actually harmful, screenshot it and email us. We\'ll fix the prompt.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Sign in → Profile → Delete account. If you can\'t reach the screen, email us from the account email and we\'ll delete it within 48 hours.',
  },
  {
    q: 'I found a bug',
    a: 'Email us. Steps to reproduce + screenshot if possible. We patch fast.',
  },
  {
    q: 'Cookbook (premium) subscription issue',
    a: "Email us with your username. We can look up subscription state, refund, or unlock manually if Apple's StoreKit choked.",
  },
  {
    q: 'Press / partnerships / investor inquiry',
    a: 'Email us with the subject line "PRESS", "PARTNER", or "INVEST". We reply faster.',
  },
];

export default function SupportPage() {
  return (
    <main className="relative min-h-screen bg-ink text-cream flex flex-col overflow-hidden">
      <GrainOverlay />

      <MarqueeStripe items={MARQUEE_ITEMS} ariaLabel="Mogster support station" />

      {/* Header bar */}
      <header className="relative z-10 px-6 pt-6 md:px-10 md:pt-8 xl:px-16 flex items-start justify-between border-b border-hazard-yellow/25 pb-6">
        <div>
          <a href="/" className="block">
            <GlitchWordmark className="block text-3xl md:text-4xl xl:text-5xl leading-none text-cream" />
          </a>
          <p className="mt-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-hazard-yellow/60">
            Issue N°01 · Support Station
          </p>
        </div>
        <a
          href="/"
          className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-hazard-yellow/60 hover:text-hazard-yellow transition-colors leading-relaxed"
        >
          ← BACK TO STATION
        </a>
      </header>

      {/* HERO */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 pt-12 md:pt-20 pb-12 md:pb-16">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 00 / incoming transmission
          </p>
          <h1 className="font-display text-6xl md:text-8xl xl:text-9xl text-cream tracking-tight leading-[0.9] mb-8">
            <span className="block">SOMETHING</span>
            <span className="block"><span className="text-hazard-yellow">COOKED?</span></span>
          </h1>
          <p className="font-mono text-sm md:text-base text-cream/80 max-w-prose leading-relaxed">
            Email-only. No tickets, no chat bots, no &quot;please wait 5–7 business days.&quot;
            Every message goes to a real human. Most replies inside 48 hours.
          </p>
        </div>
      </section>

      <HazardStripe height="sm" />

      {/* CONTACT CARD */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-12 md:py-16 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-3xl">
          <div className="border-2 border-hazard-yellow bg-ink-2 p-6 md:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-hazard-yellow mb-4">
              ▌ DIRECT LINE
            </p>
            <a
              href="mailto:help@mogster.app"
              className="font-display text-4xl md:text-6xl text-cream tracking-tight leading-none hover:text-hazard-yellow transition-colors block mb-6"
            >
              help@mogster.app
            </a>
            <ul className="font-mono text-xs md:text-sm text-cream/70 space-y-2 leading-relaxed">
              <li><span className="text-hazard-yellow">▸</span>  Response within 48 hours, usually faster</li>
              <li><span className="text-hazard-yellow">▸</span>  Email from the address on your Mogster account</li>
              <li><span className="text-hazard-yellow">▸</span>  Include username + screenshot if relevant</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 01 / faq
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-12">
            BEFORE YOU <span className="text-hazard-yellow">EMAIL</span>.
          </h2>

          <ul className="space-y-6">
            {FAQ.map(({ q, a }, idx) => (
              <li key={idx} className="border border-hazard-yellow/25 p-6 bg-ink-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-hazard-yellow mb-3">
                  {String(idx + 1).padStart(2, '0')}
                </p>
                <p className="font-display text-xl md:text-2xl leading-tight text-cream mb-3">
                  {q}
                </p>
                <p className="font-mono text-xs md:text-sm text-cream/70 leading-relaxed">
                  {a}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CRISIS NOTE */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 02 / serious stuff
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-8">
            IF YOU&apos;RE IN <span className="text-hazard-yellow">CRISIS</span>.
          </h2>
          <p className="font-mono text-sm md:text-base text-cream/80 leading-relaxed mb-6 max-w-prose">
            Mogster is for entertainment. Roasts are roasts. If you&apos;re struggling
            with body image, mental health, or anything heavier than a bad selfie,
            please reach out to someone equipped to help.
          </p>
          <ul className="font-mono text-xs md:text-sm text-cream/70 space-y-3 leading-relaxed">
            <li><span className="text-hazard-yellow">▸</span>  <strong className="text-cream">US:</strong> 988 (Suicide & Crisis Lifeline)</li>
            <li><span className="text-hazard-yellow">▸</span>  <strong className="text-cream">UK:</strong> 116 123 (Samaritans)</li>
            <li><span className="text-hazard-yellow">▸</span>  <strong className="text-cream">EU:</strong> 116 123 (most countries)</li>
            <li><span className="text-hazard-yellow">▸</span>  <strong className="text-cream">Worldwide:</strong> findahelpline.com</li>
          </ul>
        </div>
      </section>

      <HazardStripe height="sm" />

      <footer className="relative z-10 py-8 px-6 md:px-10 xl:px-16 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60 flex flex-col md:flex-row items-center md:justify-between gap-3">
        <p>© 2026 Mogster · Issue N°01</p>
        <div className="flex gap-4">
          <a href="/" className="hover:text-hazard-yellow transition-colors">Home</a>
          <span aria-hidden="true">·</span>
          <a href="/privacy" className="hover:text-hazard-yellow transition-colors">Privacy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-hazard-yellow transition-colors">Terms</a>
        </div>
      </footer>
    </main>
  );
}
