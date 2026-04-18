import HazardStripe from '@/components/HazardStripe';
import GrainOverlay from '@/components/GrainOverlay';
import GlitchWordmark from '@/components/GlitchWordmark';
import MarqueeStripe from '@/components/MarqueeStripe';
import AuraReadouts from '@/components/AuraReadouts';
import AuraBlob from '@/components/AuraBlob';
import AuraWatermark from '@/components/AuraWatermark';
import VitalsPanel from '@/components/VitalsPanel';
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
    <main className="relative min-h-screen bg-hazard-yellow flex flex-col overflow-hidden">
      <GrainOverlay />
      <AuraWatermark />
      <AuraReadouts />
      <AuraBlob />

      <MarqueeStripe items={MARQUEE_ITEMS} ariaLabel="Aura measurement station: calibrating" />

      <div className="relative z-10 flex-1 px-6 pt-16 pb-12 md:pt-24 xl:px-16">
        <div className="mx-auto w-full max-w-2xl xl:max-w-7xl xl:grid xl:grid-cols-12 xl:gap-10 xl:items-start">
          <div className="xl:col-span-8">
            <GlitchWordmark className="block text-center xl:text-left xl:text-[10rem] xl:leading-[0.85]" />

            <h1 className="mt-10 font-display text-5xl md:text-6xl xl:text-8xl text-ink text-center xl:text-left tracking-tight leading-tight">
              <span className="block">YOUR AURA.</span>
              <span className="block">RATED.</span>
              <span className="block">NO CAP.</span>
            </h1>

            <div className="mt-10 text-center xl:text-left font-mono text-base md:text-lg xl:text-xl text-ink">
              <p className="mx-auto xl:mx-0 max-w-prose">
                AI rates your aura. Chat roasts you. Mog your friends on the
                leaderboard.
              </p>
              <p className="mx-auto xl:mx-0 mt-4 max-w-prose">
                TestFlight rolling out. App Store soon.
              </p>
            </div>

            <div className="mt-12 mx-auto xl:mx-0 w-full max-w-md px-2 xl:px-0">
              <WaitlistForm />
            </div>
          </div>

          <div className="hidden xl:block xl:col-span-4 xl:mt-12">
            <VitalsPanel />
          </div>
        </div>
      </div>

      <HazardStripe height="sm" />

      <footer className="relative z-10 py-6 px-6 text-center font-mono text-xs md:text-sm uppercase text-ink">
        <a href="/privacy" className="underline">
          Privacy
        </a>
        <span aria-hidden="true"> · </span>
        <a href="/terms" className="underline">
          Terms
        </a>
        <span aria-hidden="true"> · </span>
        <a href="mailto:support@mogster.app" className="underline">
          Support
        </a>
      </footer>
    </main>
  );
}
