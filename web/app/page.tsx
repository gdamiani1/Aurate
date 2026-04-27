import HazardStripe from '@/components/HazardStripe';
import GrainOverlay from '@/components/GrainOverlay';
import GlitchWordmark from '@/components/GlitchWordmark';
import MarqueeStripe from '@/components/MarqueeStripe';
import AuraReadouts from '@/components/AuraReadouts';
import { WaitlistForm } from '@/components/WaitlistForm';

const MARQUEE_ITEMS = [
  'AURA MEASUREMENT STATION',
  'CALIBRATING',
  'SIGMA DETECTED',
  'NO CAP VERIFIED',
  'MOG LEVEL CRITICAL',
];

export default function Home() {
  return (
    <main className="relative min-h-screen bg-ink text-cream flex flex-col overflow-hidden">
      <GrainOverlay />
      <AuraReadouts />

      <MarqueeStripe items={MARQUEE_ITEMS} ariaLabel="Aura measurement station: calibrating" />

      {/* HEADER BAR ─────────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 pt-6 md:px-10 md:pt-8 xl:px-16 flex items-start justify-between border-b border-hazard-yellow/25 pb-6">
        <div>
          <GlitchWordmark className="block text-3xl md:text-4xl xl:text-5xl leading-none text-cream" />
          <p className="mt-2 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-hazard-yellow/60">
            Issue N°01 · Aura Measurement Station
          </p>
        </div>
        <div className="text-right font-mono text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-hazard-yellow/60 leading-relaxed hidden sm:block">
          Pre-launch<br />
          <span className="text-hazard-yellow">TestFlight rolling</span><br />
          App Store soon
        </div>
      </header>

      {/* HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 pt-10 md:pt-16 pb-16">
        <div className="mx-auto w-full max-w-2xl xl:max-w-7xl xl:grid xl:grid-cols-12 xl:gap-12 xl:items-start">
          <div className="xl:col-span-7">
            <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
              ── 00 / drop a pic. get cooked.
            </p>

            <h1 className="font-display text-6xl md:text-7xl xl:text-9xl text-cream tracking-tight leading-[0.9]">
              <span className="block">YOUR AURA.</span>
              <span className="block">RATED.</span>
              <span className="block">NO <span className="text-hazard-yellow">CAP.</span></span>
            </h1>

            <p className="mt-8 font-mono text-sm md:text-base text-cream/80 max-w-prose leading-relaxed">
              The hot take you screenshot and argue with. Pick your lens, get scored
              0–1000 with a roast that goes stupid hard. Climb the Mog Board.
              Battle your friends. One pic away from HIM.
            </p>

            {/* WAITLIST — above the fold */}
            <div className="mt-10 max-w-md">
              <WaitlistForm />
            </div>
          </div>

          {/* Editorial side-rail (desktop only) */}
          <aside className="hidden xl:block xl:col-span-5 xl:pt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-cream/60">
            <div className="border border-hazard-yellow/25 p-6">
              <p className="text-hazard-yellow mb-4">▌ STATION READOUT</p>
              <ul className="space-y-3 leading-relaxed">
                <li><span className="text-hazard-yellow">▸</span>  7 sigma paths</li>
                <li><span className="text-hazard-yellow">▸</span>  AI scoring 0–1000</li>
                <li><span className="text-hazard-yellow">▸</span>  global + friends mog board</li>
                <li><span className="text-hazard-yellow">▸</span>  1v1 battles, narrated</li>
                <li><span className="text-hazard-yellow">▸</span>  daily challenges, multipliers</li>
                <li><span className="text-hazard-yellow">▸</span>  the cookbook (premium)</li>
              </ul>
              <p className="mt-6 text-hazard-yellow/40 text-[9px]">
                ── Mogster is 16+ ──
              </p>
            </div>
          </aside>
        </div>
      </section>

      <HazardStripe height="sm" />

      {/* SECTION 01 — WHAT THIS IS ──────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 01 / what this is
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-8">
            DROP A PIC. PICK A LENS. <span className="text-hazard-yellow">GET COOKED.</span>
          </h2>
          <p className="font-mono text-sm md:text-base leading-relaxed text-cream/80">
            Mogster scores your selfie 0–1000 and writes a roast you&apos;ll
            screenshot. Each Sigma Path is a different lens — Auramaxxing reads
            the whole vibe, Looksmaxxing audits the drip, Mogger Mode rates how
            hard you&apos;re mogging the room. Same pic, seven different verdicts.
            Save the card. Send it to the group chat. See where you land on
            the Mog Board.
          </p>
        </div>
      </section>

      {/* SECTION 02 — THE LOOP ──────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 02 / the loop
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-12">
            FOUR STEPS TO <span className="text-hazard-yellow">SIGMA</span>.
          </h2>

          <ol className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[
              { n: '01', title: 'DROP A PIC', body: 'Selfie or camera roll. JPEG, PNG, or WEBP.' },
              { n: '02', title: 'PICK A LENS', body: 'Seven Sigma Paths. Different scoring, different verdict.' },
              { n: '03', title: 'GET COOKED', body: 'Score, personality read, 5-stat breakdown, screenshotable card.' },
              { n: '04', title: 'CLIMB OR FALL', body: 'Daily challenges, friend battles, the Mog Board awaits.' },
            ].map((step) => (
              <li key={step.n} className="border border-hazard-yellow/25 p-6 bg-ink-2">
                <p className="font-mono text-[10px] tracking-[0.3em] text-hazard-yellow mb-3">
                  {step.n}
                </p>
                <p className="font-display text-2xl md:text-3xl leading-tight mb-3">
                  {step.title}
                </p>
                <p className="font-mono text-xs text-cream/70 leading-relaxed">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SECTION 03 — TIERS ─────────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24 border-b border-hazard-yellow/25">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 03 / where you land
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-12">
            EIGHT TIERS. <span className="text-hazard-yellow">ONE PIC AWAY.</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[11px] uppercase tracking-[0.15em]">
            {[
              ['000-199', 'Down Bad'],
              ['200-399', 'NPC'],
              ['400-599', '6-7'],
              ['600-799', 'Cooking'],
              ['800-899', 'HIM / HER'],
              ['900-949', 'Sigma'],
              ['950-999', 'Mog God'],
              ['1000', 'Skibidi Legendary'],
            ].map(([range, name]) => (
              <div key={range} className="border border-hazard-yellow/25 p-4">
                <p className="text-hazard-yellow text-[9px] mb-2">{range}</p>
                <p className="font-display text-base leading-tight">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 04 — WAITLIST CTA (BOTTOM) ─────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 xl:px-16 py-16 md:py-24">
        <div className="mx-auto w-full max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-hazard-yellow mb-6">
            ── 04 / lock in
          </p>
          <h2 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] mb-6">
            WE&apos;LL SEE YOU ON <span className="text-hazard-yellow">LAUNCH DAY.</span>
          </h2>
          <p className="font-mono text-sm md:text-base text-cream/80 mb-10 max-w-prose mx-auto">
            Drop your email. We email once when it ships. No newsletter, no spam.
          </p>
          <div className="max-w-md mx-auto">
            <WaitlistForm />
          </div>
        </div>
      </section>

      <HazardStripe height="sm" />

      <footer className="relative z-10 py-8 px-6 md:px-10 xl:px-16 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/60 flex flex-col md:flex-row items-center md:justify-between gap-3">
        <p>© 2026 Mogster · Issue N°01</p>
        <div className="flex gap-4">
          <a href="/support" className="hover:text-hazard-yellow transition-colors">Support</a>
          <span aria-hidden="true">·</span>
          <a href="/privacy" className="hover:text-hazard-yellow transition-colors">Privacy</a>
          <span aria-hidden="true">·</span>
          <a href="/terms" className="hover:text-hazard-yellow transition-colors">Terms</a>
        </div>
      </footer>
    </main>
  );
}
