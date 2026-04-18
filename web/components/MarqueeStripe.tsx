import type { CSSProperties } from 'react';

interface MarqueeStripeProps {
  items: string[];
  ariaLabel: string;
}

const stripePattern: CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, var(--color-ink) 0 12px, var(--color-hazard-yellow) 12px 24px)',
};

export default function MarqueeStripe({ items, ariaLabel }: MarqueeStripeProps) {
  const joined = items.join('   ⚠   ');

  return (
    <div
      role="marquee"
      aria-label={ariaLabel}
      aria-live="off"
      className="relative w-full overflow-hidden h-12"
      style={stripePattern}
    >
      <div className="absolute inset-0 flex items-center">
        <div className="mogster-marquee-track flex shrink-0 whitespace-nowrap">
          <span className="bg-hazard-yellow text-ink font-display uppercase tracking-wide px-6 py-1 border-y-2 border-ink text-lg md:text-xl">
            {joined}   ⚠
          </span>
          <span
            aria-hidden="true"
            className="bg-hazard-yellow text-ink font-display uppercase tracking-wide px-6 py-1 border-y-2 border-ink text-lg md:text-xl"
          >
            {joined}   ⚠
          </span>
        </div>
      </div>
    </div>
  );
}
