# Mogster Design System

> "Your aura. Rated. No cap."
> Issue N°01 · Aura Measurement Station

This is the production design system for **Mogster** — an iOS-first AI selfie-rating app for Gen Z 16+. Drop a pic, pick a Sigma Path (a scoring lens), get scored 0–1000 with a roast and a 5-stat breakdown on a screenshotable card. Climb the **Mog Board**, challenge friends to **1v1 Battles**, complete **Daily Challenges** with score multipliers.

The system covers a single visual mode — **HAZARD** (dark editorial × brutalist × hazard-tape industrial). BLOOD mode is deferred to V2.

---

## Sources

| Source | Path / Link | Notes |
|---|---|---|
| iOS app codebase (React Native / Expo) | `Aurate/app/` (mounted) | Production app — components, screens, theme |
| Marketing site (Next.js) | `Aurate/web/` (mounted) | Live at `mogster.app` — visual direction reference |
| Backend | `Aurate/server/` (mounted) | Out of scope for design |
| Design direction spec | `Aurate/docs/design/mogster-redesign.html` | The brutalist-editorial direction the system implements |
| GitHub | `gdamiani1/Mogster` (master) | Same code as `Aurate/` mount |

---

## Index

```
Mogster Design System/
├── README.md                  ← you are here
├── SKILL.md                   ← Agent Skills entry-point
├── colors_and_type.css        ← all design tokens as CSS vars
├── assets/                    ← logos, icons, illustrations
├── preview/                   ← design-system specimen cards (one per token cluster)
└── ui_kits/
    └── mogster_app/           ← iOS app UI kit — screens + components as React/HTML
        ├── README.md
        ├── index.html         ← interactive click-thru prototype
        └── *.jsx              ← screen + component recreations
```

Sample slides are not included — none were attached.

---

## Brand at a glance

- **Verdict:** punk editorial, Gen-Z native, brutal but knowing.
- **Frame:** "Issue N°01 / Aura Measurement Station" — magazine cover, not app screen.
- **Visual DNA:** dark editorial paper, hazard-yellow accent, Anton-on-ink display, JetBrains Mono everywhere else, halftone grain, hazard-tape stripes as section dividers.
- **References (steal the right things):** Supreme drop pages (color discipline, type scale), MSCHF (wit, brutalism), UFC poster design (high-contrast portraiture), vintage TIME / LIFE covers (eyebrows, issue numbers, datelines), 1970s industrial signage (hazard tape, stencils).
- **NOT references:** Headspace, BeReal pastels, anything that says "wellness app."

---

## CONTENT FUNDAMENTALS

### Voice register — two registers stacked

Mogster speaks in **two simultaneous registers** and the contrast IS the brand:

1. **ALL-CAPS DISPLAY** — carries structure. Headlines, screen titles, tier names, scores, primary CTA labels. Set in Anton.
2. **lowercase microcopy** — carries voice. Subheads, button helper text, error messages, supportive prose. Set in JetBrains Mono.

**Don't mix up which job each is doing.** Display in lowercase reads as too casual; microcopy in caps reads as shouting.

### Tone

- **Brutal but knowing.** "we don't serve minors fr fr" — half mean, half winking.
- **Self-aware.** Parentheticals like "(you can switch. we don't judge. the AI does.)"
- **First-person, occasionally.** Mogster is the entity rating you: *"the kitchen's open later"*, *"we couldn't cook this one."*
- **The user's identity is implicit.** Never "Hey [name]!", never "Welcome back!". The user is here; we don't need to overstate it.
- **No "powered by AI" badges.** Mogster IS the AI. Never describe the tech.
- **No corporate wellness words.** Banned: cute, sweet, journey, empower, community, wellbeing.

### Mandatory vocabulary

Use freely: **sigma, mogger, mog board, cooked, mid, brainrot, skibidi, ohio, looksmaxxing, no cap, fr fr, drip, rizz, glow-up, NPC, HIM/HER, down bad**.

### Real examples (lifted from the codebase)

| Type | Example |
|---|---|
| Display headline | `YOUR AURA. RATED. NO CAP.` |
| Display headline | `DROP A PIC. PICK A LENS. GET COOKED.` |
| Eyebrow | `── 02 / pick a lens` |
| Eyebrow | `SECTION 02 · THE RANKING` |
| Section title | `MOG BOARD.` / `WHO'S ACTUALLY HIM RIGHT NOW` |
| Loading | `Analyzing your aura fr fr…` / `Computing the mog differential…` / `The AI is cooking rn…` |
| Error (moderation A) | headline `AURA UNREADABLE.` / sub `keep building, king. drop another.` |
| Error (moderation C) | headline `WE COULDN'T COOK THIS ONE.` / sub `take 5. come back. the kitchen's open later.` |
| Hard-lock | `ACCOUNT UNDER REVIEW.` / `email help@mogster.app to unlock — we'll cook again soon.` |
| Empty leaderboard | `NO ONE'S COOKING YET. BE THE FIRST TO DROP A PIC.` |
| Save success | `W secured` (toast) — `Card saved to your camera roll` |
| Save failure | `L detected` (toast) — `Failed to save card` |
| Permission ask | `Need camera access to check your aura fr` |

### Punctuation & casing rules

- Period after the wordmark always: **MOGSTER.** (the dot is the hazard-yellow accent)
- Em-dashes `—` for editorial pauses, en-dashes `–` for ranges (`0–1000`)
- Eyebrows lead with `──` or `▌` and a section number: `── 02 / lock in`
- ALL-CAPS uses no terminal punctuation when single-line: `GET COOKED` not `GET COOKED.`
- Lowercase microcopy may end with a period or no punctuation; both fine.
- "fr" and "fr fr" are lowercase always.
- Use `&` only inside ALL-CAPS display; spell out "and" in microcopy.

### Emoji policy

**Mostly no.** The brand is verbal-witty, not emoji-witty. Existing internal data uses emoji (🌀 💎 👁 🔥 💸 💀 ⚡) for Sigma Paths, but in the redesigned UI these are **replaced by Anton wordmarks and unicode glyphs** (▌ ◉ ⚔ → ↗ ↓ ★ ☆). One unicode glyph per element, never decorative pile-ons.

---

## VISUAL FOUNDATIONS

### Color

**One mode only — HAZARD (dark).** No light mode.

| Role | Token | Hex |
|---|---|---|
| Primary background | `--ink` | `#0A0A0A` |
| Cards / elevated | `--ink-2` | `#14140F` |
| Slightly lifted | `--ink-3` | `#1A1A12` |
| Primary text (never pure white) | `--paper` | `#F5F1E6` |
| Secondary text | `--paper-mute` | `#A8A89B` |
| Metadata / "less than" | `--ghost` | `#6B6B5E` |
| **Accent — use scarcely** | `--hazard` | `#FFD60A` |
| HIGH (wins, top tiers) | `--mint` | `#7FFFA1` |
| LOSS (errors, low tiers) | `--blood` | `#FF3B30` |
| Hairline border | `--border` | `#252520` |
| Hazard-tinted border | `--border-haz` | `rgba(255,214,10,0.25)` |

**Hazard-yellow rules.** It is a *scarce accent*, not a flood color. Use it for: the wordmark dot, eyebrow lines + numbers, the primary CTA fill, selected-state fills (chips, tabs), tier accents on top scores, the issue-number stamp. Never as a section background, never as a body text color, never as a gradient.

### Type

| Family | Use | Loaded from |
|---|---|---|
| **Anton** (regular) | display, scores, headlines, tier names, CTA labels — always uppercase | local · `fonts/Anton_400_Regular.ttf` |
| **JetBrains Mono** (400/500/700) | body, microcopy, eyebrows, labels, metadata, captions — both cases | Google Fonts |
| **Bungee** (sparingly) | stamps, badges where Anton would feel too clean | Google Fonts |

> **No Inter / no body sans-serif for prose.** JetBrains Mono *is* the body face. Lean into the mono register; it carries the magazine-print feel.

Anton has a tall ascent box — `lineHeight = fontSize × 1.15` and `paddingTop = fontSize × 0.12` are required to keep tops from clipping. The codebase encodes this via `displayText(size)` in `theme.ts`.

### Spacing

4px base, exponential: `xs 4 / sm 8 / md 16 / lg 24 / xl 32 / 2x 48 / 3x 64 / 4x 96`.

### Backgrounds & textures

- **Backgrounds are flat.** No gradients except where physically meaningful (an aura-color blob behind a score, the photo→ink fade on a result card).
- **Grain overlay always.** A fine SVG noise (turbulence, freq 0.9) at `opacity 0.07`, `mix-blend-mode: overlay`, fixed full-screen — sits over every page. Mandatory.
- **Hazard tape stripes** as section dividers — `repeating-linear-gradient(45deg, ink 0 12px, hazard 12px 24px)`. Use sparingly. Two heights: 24px (page header rule), 48px (section break, often with a centered Anton label).
- **Marquee tickers** of brand vocab (`AURA MEASUREMENT STATION · CALIBRATING · SIGMA DETECTED · NO CAP VERIFIED`) on hazard tape, scrolling 40s linear.
- **Scanlines** are allowed where they earn their place (loading states, terminal-readout panels). Subtle: `repeating-linear-gradient(0deg, transparent 0-2px, rgba(0,0,0,0.15) 3px, transparent 4px)` with `mix-blend-mode: multiply`.
- **No drop shadows on cards.** Use 1px hairline borders.
- **No glass / frosted blur / neumorphism.** Ever.
- **No protection gradients on hero photography**, except inside the result card where a photo→ink fade is required for legibility.

### Borders & corners

- **Sharp corners by default** (`--r-card: 0`). Editorial cards do not round.
- A 1px hairline (`--border: #252520`) sits around every card and chip.
- Hazard-tinted hairlines (`rgba(255,214,10,0.25)`) sit under section headers to carry the eyebrow color.
- Dashed borders (`2px dashed --hazard`) only on moderation-reject cards — they reference customs forms.

### Cards

- Background `--ink-2`, hairline border, sharp corners, no shadow.
- Result cards (the screenshotable artifact) are **9:16 portraits** with: full-bleed photo (top 75%), dark-fade gradient (bottom 55%), hazard-tinted crop-marks at all four corners (referencing print bleed marks), top metadata strip (rotated path-stamp + issue number / date), and a bottom editorial block (tier label + huge score + roast).

### Hover & press states

- **Mobile-first — no hover.** Web mirror uses `hover:text-hazard-yellow transition-colors` for nav links only.
- **Press states are SNAP, not springy.** `activeOpacity: 0.7-0.85` on `TouchableOpacity` (RN). No scale-down, no shadow change, no spring physics.
- **Selected states are instant fills.** Tap a chip → it becomes hazard-yellow with ink text. No transition.

### Motion

The default register is **SLAM-CUT**. Cuts are punctuation. iOS users will feel the weight because most apps wash transitions.

| Context | Treatment |
|---|---|
| Default screen → screen | Slam-cut. Instant. No fade, no slide. |
| Major reveals (score result, battle outcome, paywall) | **HAZARD-WIPE** — horizontal hazard-tape stripe sweeps across in 180ms while screens swap mid-wipe. |
| Score reveal | 120ms black frame → 60ms scale-from-110% snap on the number → stat breakdown fades in below |
| Counter | Tasteful 300–600ms count-up. NOT a slot-machine spin. |
| Mount fades | 200–400ms ease-out fade-up — primary content only, secondary is instant |
| Selected/hover | Instant snap (no easing) |
| Loading | Rotating brainrot copy every ~2.2s — never a spinner |
| Modal opens | Instant cut. No spring. No overshoot. Dismisses instantly too. |
| Tab changes | Instant cut. iOS default cross-fade is forbidden. |
| Battle rounds | Each round narration slam-cuts to the next, like fight commentary intercutting between corners. |
| Wordmark | Electric-flicker strike at random 2.5–6s intervals (cyan arc drop-shadow + flicker keyframes). Don't extend this pattern elsewhere. |

What NOT to use: iOS default modal slide-up · spring physics on UI · cross-fades · "celebratory" motion (Mogster doesn't congratulate) · smooth color transitions on tap.

### Layout rules

- Mobile-first. **Everything fits a one-handed thumb reach** — primary CTAs in the lower half, primary actions on the right.
- **Information density is good.** Eyebrows, issue numbers, datelines, version stamps, ALL-CAPS tier strips. White-space-as-luxury is wrong here.
- Editorial **eyebrows lead every section** — "── 02 / pick a lens" — and pair with a 24px hazard hairline above.
- The wordmark always renders as `MOGSTER.` with the period in hazard-yellow.

### Imagery

- High-contrast portrait photography. Cool/desaturated, never warm-fuzzy.
- Selfies stay un-retouched — Mogster rates the truth.
- Generic placeholder fills are linear gradients between two muted cool tones (`#5a5a5a → #2a2a2a`); for top-tier results use a radial hot blob (`#FFD60A → #FF6B00 → #1A0000`).
- No stock illustrations. No abstract gradient blobs. No phone mockups.

### Iconography — see ICONOGRAPHY section below

---

## ICONOGRAPHY

Mogster uses **as little iconography as possible**. The brand leans on type — Anton, JetBrains Mono, and unicode glyphs do the work icons usually do.

### Sources currently in the codebase

- **`@expo/vector-icons` / FontAwesome** — used in the iOS tab bar only (`camera`, `trophy`, `user`, `bolt`). Sized at 24px, in `--hazard` when active and `--ghost` when inactive.
- **No custom SVG icon system.** No Lucide, no Heroicons, no Feather.
- **No iconfont** beyond FontAwesome.
- **Lucide via CDN** (`https://unpkg.com/lucide-static`) is the **substitution recommendation** for HTML mocks/prototypes — same stroke weight, neutral fill style, fits the editorial register. Flagged as a substitution; production uses FontAwesome.
- **Logo assets** (`assets/mogster-icon.png`, etc.) — a few iOS launcher PNGs from `Aurate/app/assets/images/`. There is no SVG wordmark; the wordmark is rendered as live Anton text + a hazard-yellow period.

### Glyph vocabulary (preferred over icons)

Used as inline characters — no border, no fill, just the glyph in `--paper` or `--hazard`:

| Glyph | Use |
|---|---|
| `→` | "next", "continue", primary action arrow |
| `←` | "back" |
| `↗` | share / open external |
| `↓` | download / save |
| `★ / ☆` | bookmarked / not bookmarked |
| `▌` | section marker (eyebrow prefix) |
| `◉` | "live" / "latest" indicator |
| `⚔` | incoming battle |
| `⚠` | marquee separator |
| `●` | stat dots, separators |
| `──` | em-dash rule before eyebrows |
| `· · ·` | metadata separators |

### Emoji

**Effectively banned in UI.** Some legacy backend data uses emoji on Sigma Paths (🌀 💎 👁 🔥 💸 💀 ⚡); the redesign drops them in favor of all-caps wordmarks (`AURAMAXXING`, `LOOKSMAXXING`, etc.). Toast headlines occasionally use emoji-adjacent unicode (`✓ COMPLETED`) — that's the ceiling.

### Logos

- `assets/mogster-icon.png` — square iOS launcher icon (1024×1024, hazard-yellow on ink).
- `assets/mogster-adaptive-icon.png` — Android adaptive layer.
- `assets/mogster-splash-icon.png` — splash screen mark.
- `assets/mogster-favicon.png` — web favicon.
- The **wordmark** is always live Anton + hazard period — never an image. Use the `<Wordmark>` component (RN) or `<GlitchWordmark>` (web) so the electric-flicker animation runs correctly.

---

## CAVEATS — flagged substitutions

- **Bungee** is referenced in `theme.ts` (`FONTS.stencil`) but only used in the design-direction spec, not yet in production screens. Loaded from Google Fonts.
- **Anton** ships as a brand font in `fonts/Anton_400_Regular.ttf` (loaded via `@font-face`). **JetBrains Mono** loads from Google Fonts. Production codebase loads them via `@expo-google-fonts/anton` and `@expo-google-fonts/jetbrains-mono` — same families, no substitutions.
- The original codebase shipped `SpaceMono-Regular.ttf` — superseded by JetBrains Mono in the redesign and not used in current UI.
- Emoji glyphs on Sigma Paths in `paths.ts` are **legacy** — the redesigned UI drops them. Carried in tokens for backwards-compat with backend data only.
