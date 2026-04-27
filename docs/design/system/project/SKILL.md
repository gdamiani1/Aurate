# Mogster Design System — Skill

> When designing for **Mogster**, load this entire directory's docs and tokens before producing UI. Mogster has a strong, specific aesthetic — getting it right means committing to it, not averaging it out.

## When to use
Any design work for the **Mogster** iOS app, marketing site, or social/promotional artifacts. The brand: punk-editorial, Gen-Z native, "your aura. rated. no cap."

## Before you start
1. Read `README.md` end-to-end — voice, color, type, motion rules. The voice section is mandatory; copy register makes or breaks Mogster.
2. Link to tokens via `<link rel="stylesheet" href="path/to/colors_and_type.css">` — never duplicate values.
3. Use the local Anton font already wired in `colors_and_type.css` (`fonts/Anton_400_Regular.ttf`). JetBrains Mono comes from Google Fonts. Don't substitute either.
4. Skim `preview/` to see tokens in context. Lift patterns from `ui_kits/mogster_app/screens.jsx` for app-screen work.

## Non-negotiables
- **Dark only.** No light mode. Background is `--ink (#0A0A0A)`, text is `--paper (#F5F1E6)` — never pure white.
- **Hazard yellow `#FFD60A` is scarce.** Wordmark dot, eyebrow lines, primary CTA, selected fill, top-tier accent. **Never** as a section background, body text, or in a gradient.
- **Two type registers, never confused.** ALL-CAPS Anton carries structure (headlines, scores, tier labels, CTAs). lowercase JetBrains Mono carries voice (microcopy, support copy, errors). Mono **is** the body face — no Inter, no system sans.
- **Sharp corners. Hairline borders. No drop shadows. No glass.** Cards use `1px solid #252520`, radius `0`.
- **Grain overlay always on** — fixed full-screen SVG noise at `opacity: 0.07`, `mix-blend-mode: overlay`.
- **Slam-cuts, not transitions.** Default screen→screen is 0ms instant. Reserve hazard-wipe (180ms) for major reveals only. No springs, no cross-fades, no congratulating motion.
- **Mandatory vocabulary** in copy: sigma, mogger, mog board, cooked, mid, brainrot, no cap, fr fr, NPC, HIM/HER, etc. **Banned**: cute, sweet, journey, empower, community, wellbeing.
- **Iconography is minimal.** Prefer unicode glyphs (`→ ↗ ↓ ◉ ⚔ ▌ ●`) over icons. Tab bar uses FontAwesome in production; substitute Lucide for HTML mocks if needed.
- **No emoji in UI.** Legacy backend data has emoji on Sigma Paths — strip them.
- **Wordmark is always live type**, never an image: `MOGSTER<span style="color: var(--hazard)">.</span>` in Anton.

## File index
```
README.md                     ← exhaustive brand + token docs
colors_and_type.css           ← all CSS variables, @font-face, base element styles
fonts/Anton_400_Regular.ttf   ← brand font, local
assets/                       ← logos
preview/                      ← 25 specimen cards (one per token cluster)
ui_kits/mogster_app/          ← 14 iOS app screens, React/HTML
```

## When something doesn't fit
If a design need isn't covered (a chart, a settings sub-screen, a marketing email), extend by combining existing tokens — don't introduce new colors, new fonts, or rounded corners. If the gap is real, flag it as a "system extension proposed" and wait for direction.

## Caveats
- The kit's tab-bar glyphs use unicode for portability. Production iOS uses FontAwesome.
- Photography in mockups is gradient placeholder — replace with real selfies in production.
- Bungee is loaded but used sparingly; only for stamp/badge moments where Anton would feel too clean.
