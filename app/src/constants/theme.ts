// Mogster design system — implementation foundation
// Source of truth: docs/design/system/project/colors_and_type.css
// Brand bible:     docs/design/system/project/README.md
//
// Convention: new code uses canonical token names (ink, hazard, paper, etc.).
// Existing code references via legacy aliases (bg, primary, textPrimary, etc.)
// stay valid — same hex values, no breakage. Migrate progressively.

export const COLORS = {
  // ─── CANONICAL (use these in new code) ────────────────────────────

  // Ground — the dark
  ink: "#0A0A0A",        // primary background
  ink2: "#14140F",       // cards, elevated surfaces
  ink3: "#1A1A12",       // slightly lifted

  // Paper — the light, never pure white
  paper: "#F5F1E6",      // primary text on dark
  paperMute: "#A8A89B",  // secondary text
  ghost: "#6B6B5E",      // metadata, captions, "less than"

  // Signature accent — use SCARCELY
  hazard: "#FFD60A",     // wordmark dot, eyebrows, primary CTA, selected fills
  hazard25: "rgba(255, 214, 10, 0.25)",
  hazard12: "rgba(255, 214, 10, 0.12)",
  hazard06: "rgba(255, 214, 10, 0.06)",

  // Semantic
  mint: "#7FFFA1",       // HIGH — wins, top tiers
  blood: "#FF3B30",      // LOSS — errors, low tiers

  // Tier-specific accents (used inside cards)
  tierGold: "#FFB84D",   // COOKING
  tierBronze: "#C9A14A", // 6-7
  tierGrey: "#8A8878",   // NPC

  // Lines
  border: "#252520",
  borderHaz: "rgba(255, 214, 10, 0.25)",

  // Wordmark electric arc (glitch animation only — not for general UI)
  arcCyan: "#00E5FF",

  // ─── LEGACY ALIASES (existing code — do not use in new code) ──────

  bg: "#0A0A0A",                              // → ink
  bgCard: "#14140F",                          // → ink2
  bgElevated: "#1A1A12",                      // → ink3
  primary: "#FFD60A",                         // → hazard
  textPrimary: "#F5F1E6",                     // → paper
  textSecondary: "#A8A89B",                   // → paperMute
  textMuted: "#6B6B5E",                       // → ghost
  borderAccent: "rgba(255, 214, 10, 0.25)",   // → borderHaz
  secondary: "#FFD60A",                       // → hazard
  accent: "#7FFFA1",                          // → mint
  success: "#7FFFA1",                         // → mint
  danger: "#FF3B30",                          // → blood
  warning: "#FFD60A",                         // → hazard
};

// 4px base, exponential. xxl is the legacy alias for 2x.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,  // legacy alias
  s2x: 48,
  s3x: 64,
  s4x: 96,
};

// Sharp by default. Editorial cards do not round.
export const RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,    // legacy — used by older form/input styles, do not extend
  card: 0,   // editorial cards
};

export const FONTS = {
  display: "Anton_400Regular",         // headlines, scores, tier labels, CTA labels — always uppercase
  stencil: "Bungee_400Regular",        // stamps, badges, sparingly
  mono: "JetBrainsMono_400Regular",    // body, microcopy, eyebrows, labels, captions
  monoBold: "JetBrainsMono_700Bold",   // emphasized mono
};

// Semantic type scale — adapted to mobile from the design system's clamp() values.
// Use for any new typography. Compose with the displayText() helper for
// Anton-specific metrics so ascenders don't clip.
export const TYPE = {
  display1: { size: 64, leading: 0.85, tracking: -0.02 },  // page-killing display
  display2: { size: 48, leading: 0.9,  tracking: -0.02 },  // section title
  headline: { size: 28, leading: 1.15, tracking: -0.01 },  // card headline
  score:    { size: 120, leading: 0.85, tracking: -0.05 }, // mega score on cards

  eyebrow:  { size: 11, leading: 1.2,  tracking: 0.3, weight: "500" as const },  // "── 02 / pick a lens"
  label:    { size: 10, leading: 1.2,  tracking: 0.2, weight: "700" as const },  // ALL-CAPS metadata
  body:     { size: 14, leading: 1.55, tracking: 0.005 },                        // mono body
  caption:  { size: 11, leading: 1.5,  tracking: 0.05 },                         // metadata
};

// Motion timings — slam-cut is the default register. iOS users feel the weight
// because most apps wash transitions; Mogster doesn't.
export const MOTION = {
  instant: 0,    // selected/hover snap, slam-cut
  slamCut: 0,    // alias — explicit
  tap: 60,       // score scale-in snap
  fast: 180,     // hazard-wipe traversal
  mount: 320,    // fade-up reveals
  counter: 500,  // score counter sweep
};

/**
 * Anton has a tall ascent box — text gets top-clipped if lineHeight is too
 * tight. Use this helper for any Anton Text to get consistent safe metrics.
 *
 * Pass the font size; it returns {fontFamily, fontSize, lineHeight,
 * includeFontPadding, paddingTop}. letterSpacing is still up to the caller.
 *
 * Rule of thumb: lineHeight = fontSize * 1.15, paddingTop = fontSize * 0.12.
 */
export function displayText(size: number) {
  return {
    fontFamily: FONTS.display,
    fontSize: size,
    lineHeight: Math.round(size * 1.15),
    includeFontPadding: false as const,
    paddingTop: Math.round(size * 0.12),
  };
}

// SVG noise data URI for grain overlay backgrounds. Use opacity 0.07 +
// mix-blend-mode overlay (RN: needs `BlurView`/Image overlay since RN doesn't
// support mix-blend-mode natively — current usage is web-only).
export const GRAIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity="0.5"/></svg>`;
