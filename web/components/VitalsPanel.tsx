/**
 * Scoreboard-style diagnostic panel shown in the xl-breakpoint right column.
 * Presents the same aura diagnostics as the drifting AuraReadouts, but as an
 * intentional control-panel block with larger type and a brutalist frame.
 *
 * The last digit of numeric readouts flickers via the same three-stacked-
 * span trick as AuraReadouts (CSS classes in globals.css).
 */

interface VitalRow {
  label: string;
  /** Static suffix (e.g. "OK", "ULTRA", "MAX"). */
  value?: string;
  /** Three digits that flicker through the last character slot. */
  flicker?: { prefix: string; digits: [string, string, string] };
}

const ROWS: VitalRow[] = [
  { label: 'AURA', flicker: { prefix: '98', digits: ['4', '7', '1'] } },
  { label: 'SIGMA', value: 'OK' },
  { label: 'MOG %', flicker: { prefix: '97.', digits: ['3', '8', '1'] } },
  { label: 'VIBE', value: 'ULTRA' },
  { label: 'COPE', value: 'LOW' },
  { label: 'DRIP', value: 'MAX' },
  { label: 'RIZZ', flicker: { prefix: '10', digits: ['4', '9', '6'] } },
  { label: 'STATUS', value: 'ONLINE' },
];

export default function VitalsPanel() {
  return (
    <aside
      aria-hidden="true"
      className="relative z-10 border-2 border-ink bg-cream/80 backdrop-blur-[1px]"
    >
      <div
        className="font-display uppercase tracking-wide text-ink text-lg px-4 py-2 border-b-2 border-ink"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, var(--color-ink) 0 10px, var(--color-hazard-yellow) 10px 20px)',
        }}
      >
        <span className="bg-hazard-yellow px-2 py-[2px] border-2 border-ink inline-block">
          ⚠ AURA VITALS ⚠
        </span>
      </div>

      <ul className="font-mono text-base text-ink divide-y divide-ink/20">
        {ROWS.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between px-4 py-2"
          >
            <span className="tracking-wide">{row.label}</span>
            <span className="font-display tracking-wider">
              {row.flicker ? (
                <>
                  {row.flicker.prefix}
                  <span className="mogster-flicker relative inline-block w-[0.6em] text-center">
                    <span className="absolute inset-0">{row.flicker.digits[0]}</span>
                    <span className="absolute inset-0">{row.flicker.digits[1]}</span>
                    <span className="absolute inset-0">{row.flicker.digits[2]}</span>
                    <span className="invisible">0</span>
                  </span>
                </>
              ) : (
                row.value
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="border-t-2 border-ink px-4 py-2 font-mono text-xs text-ink/70">
        LAST CALIBRATION: 2026-04-18 14:32:07 UTC
      </div>
    </aside>
  );
}
