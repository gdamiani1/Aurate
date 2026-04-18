/**
 * Giant vertical "AURA" watermark down the left edge of the viewport.
 * Only rendered at xl+ breakpoints so it doesn't compete with content on
 * smaller screens. Decorative — aria-hidden, pointer-events: none.
 */
export default function AuraWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden xl:flex items-center justify-center"
      style={{ width: '10rem' }}
    >
      <span
        className="font-display uppercase text-ink leading-none select-none"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: '9rem',
          opacity: 0.1,
          letterSpacing: '0.05em',
        }}
      >
        AURA
      </span>
    </div>
  );
}
