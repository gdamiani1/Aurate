/**
 * Hero variant of the MOGSTER wordmark with a one-shot glitch-settle entrance.
 * The main span is painted at its final position from frame 1 (LCP-safe);
 * the cyan/magenta ::before/::after layers fade in additively over ~1s.
 */
interface GlitchWordmarkProps {
  className?: string;
}

export default function GlitchWordmark({ className }: GlitchWordmarkProps) {
  return (
    <span
      className={`font-display uppercase tracking-tight text-ink leading-none inline-block text-7xl md:text-8xl${
        className ? ` ${className}` : ''
      }`}
    >
      <span className="mogster-glitch" data-text="MOGSTER">
        MOGSTER
      </span>
      <span>.</span>
    </span>
  );
}
