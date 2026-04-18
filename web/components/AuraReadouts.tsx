import type { CSSProperties } from 'react';

/**
 * Ambient "diagnostic" chips that drift across the background like a scoreboard.
 * Decorative — aria-hidden, pointer-events: none.
 *
 * Each readout gets drift distance/duration via CSS vars so one keyframe covers
 * all six. Numeric readouts flicker their last digit via three stacked spans.
 */

type Readout = {
  label: string;
  flicker?: [string, string, string];
  /** Tailwind classes for initial position. */
  pos: string;
  driftX: string;
  driftY: string;
  duration: string;
};

const READOUTS: Readout[] = [
  {
    label: 'AURA: 98',
    flicker: ['4', '7', '1'],
    pos: 'top-[12%] left-[6%]',
    driftX: '120px',
    driftY: '80px',
    duration: '140s',
  },
  {
    label: 'SIGMA CHK: OK',
    pos: 'top-[18%] right-[8%]',
    driftX: '-140px',
    driftY: '60px',
    duration: '180s',
  },
  {
    label: 'MOG %: 97.',
    flicker: ['3', '8', '1'],
    pos: 'top-[46%] left-[4%]',
    driftX: '180px',
    driftY: '-100px',
    duration: '110s',
  },
  {
    label: 'VIBE: ULTRA',
    pos: 'top-[52%] right-[5%]',
    driftX: '-100px',
    driftY: '140px',
    duration: '160s',
  },
  {
    label: 'COPE: LOW',
    pos: 'bottom-[20%] left-[8%]',
    driftX: '160px',
    driftY: '-80px',
    duration: '130s',
  },
  {
    label: 'DRIP: MAX',
    pos: 'bottom-[14%] right-[10%]',
    driftX: '-180px',
    driftY: '-60px',
    duration: '150s',
  },
];

export default function AuraReadouts() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden hidden md:block xl:hidden"
    >
      {READOUTS.map((r, i) => (
        <div
          key={i}
          className={`mogster-aura-readout absolute font-mono text-[11px] text-ink/40 border border-ink/30 px-2 py-[2px] ${r.pos}`}
          style={
            {
              '--mogster-drift-x': r.driftX,
              '--mogster-drift-y': r.driftY,
              '--mogster-drift-duration': r.duration,
            } as CSSProperties
          }
        >
          {r.flicker ? (
            <>
              {r.label}
              <span className="mogster-flicker relative inline-block w-[0.6em] text-center">
                <span className="absolute inset-0">{r.flicker[0]}</span>
                <span className="absolute inset-0">{r.flicker[1]}</span>
                <span className="absolute inset-0">{r.flicker[2]}</span>
                <span className="invisible">0</span>
              </span>
            </>
          ) : (
            r.label
          )}
        </div>
      ))}
    </div>
  );
}
