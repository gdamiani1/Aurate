# Mogster · iOS UI Kit

A 14-screen recreation of the Mogster iOS app rendered as React components inside iOS device frames.

Open `index.html` to see the full kit on one canvas.

## Screens

| # | Screen | Purpose |
|---|---|---|
| 01 | Splash | First-run entry · big wordmark · age warning |
| 02 | Age Gate | DOB picker · 16+ verification (we don't serve minors fr fr) |
| 03 | Home / Camera | The always-here screen · live viewfinder · shutter |
| 04 | Pick a Lens | Sigma Path selector — auramaxxing, looksmaxxing, mogger mode, etc. |
| 05 | Analyzing | Scanline-read panel · rotating brainrot loading copy |
| 06 | Score Result | The screenshotable card — 0-1000, tier label, 5-stat breakdown, roast |
| 07 | Mog Board | Global leaderboard · top row hazard-fill · "you" highlight |
| 08 | 1v1 Battle | Split-screen score-off, 3 rounds, commentary panel |
| 09 | Challenges | Daily lock-in checklist · score multipliers stack |
| 10 | Profile | The file — peak/avg/rank · 9:16 history grid |
| 11 | Paywall | Kitchen closed · MOGSTER PLUS upsell |
| 12 | Reject | Moderation reject · dashed customs-form treatment |
| 13 | Top Tier (1000) | Skibidi alert — radial-glow rare-max state |
| 14 | Settings | Account toggles · destructive at bottom |

## Implementation notes

- All screens are React components in `screens.jsx`, sharing a small set of primitives (`Eyebrow`, `Wordmark`, `TabBar`, `StatusStrip`, `PortraitFill`).
- The iOS chrome comes from `ios-frame.jsx` (the standard starter — set to `iphone-15`, `theme="dark"`, width 320px to fit a 4-wide grid).
- Photography is deliberately **placeholder** — gradients (`#5a5a5a → #2a2a2a` cool, `#6b5a4a → #2a221a` warm, hazard radial for top-tier). Real product uses the user's selfie. Replace `<PortraitFill>` with an `<img>` when wiring real images.
- All design tokens come from the system — see `../../colors_and_type.css`. The kit's own `kit.css` only adds page chrome (the marquee, header, grid).

## Caveats

- Tab bar glyphs use unicode (`◉ △ ⚔ ●`) instead of FontAwesome to keep the kit dependency-free in the browser. Production app uses FontAwesome `camera / trophy / bolt / user`.
- No animations are implemented in this kit — motion is documented in the design system's `preview/motion.html` and the README.
- The result card and top-tier screens are static; the real product runs a counter-up on the score and a hazard-wipe transition into them.
