import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { COLORS, FONTS } from "../constants/theme";

// 8 tier-accent treatments per design system spec.
// Spec: docs/design/system/project/preview/colors-tiers.html
//
// Each tier has a distinct visual register:
//   1 DOWN BAD  — dead, near-black, dim red lifeline + horizontal scanlines
//   2 NPC       — flat institutional grey, scanlines, subdued
//   3 6 - 7     — dim bronze, no animation
//   4 COOKING   — orange→red gradient, hazard tape top stripe
//   5 HIM/HER   — full hazard fill + ★ stamp, ink text
//   6 SIGMA     — hazard with diagonal hazard tape pattern + ▌▌ stamp + halo
//   7 MOG GOD   — radial heat (yellow→orange→red→black), glowing text + ◉ HEAT
//   8 SKIBIDI   — holographic gradient sweep, RGB chroma, scanlines, GLITCH
//
// Two sizes: "lg" for hero score reveal, "sm" for list rows.

export type TierKey =
  | "down_bad" | "npc" | "6_7" | "cooking"
  | "him_her" | "sigma" | "mog_god" | "skibidi";

export function tierKeyFromName(tier: string): TierKey {
  const u = tier.toUpperCase();
  if (u.includes("SKIBIDI")) return "skibidi";
  if (u.includes("MOG GOD")) return "mog_god";
  if (u.includes("SIGMA")) return "sigma";
  if (u.includes("HIM") || u.includes("HER")) return "him_her";
  if (u.includes("COOK")) return "cooking";
  if (u.includes("6") || u.includes("SEVEN") || u.includes("6-7") || u.includes("6 — 7")) return "6_7";
  if (u.includes("NPC")) return "npc";
  return "down_bad";
}

interface TierBadgeProps {
  tier: TierKey | string;
  rank?: string;          // "01"…"08" — optional. Lookup from tier if omitted.
  name?: string;          // "DOWN BAD", "MOG GOD", etc.
  range?: string;         // "000–199 · L" subtitle. Optional.
  size?: "lg" | "sm";     // lg for hero, sm for list rows
}

const RANK_FOR: Record<TierKey, string> = {
  down_bad: "01",
  npc: "02",
  "6_7": "03",
  cooking: "04",
  him_her: "05",
  sigma: "06",
  mog_god: "07",
  skibidi: "08",
};

const RANGE_FOR: Record<TierKey, string> = {
  down_bad: "000–199 · L",
  npc: "200–399 · MID",
  "6_7": "400–599 · OK",
  cooking: "600–799 · HOT",
  him_her: "800–899 · W",
  sigma: "900–949 · ELITE",
  mog_god: "950–999 · RARE",
  skibidi: "1000 · NO CAP",
};

const NAME_FOR: Record<TierKey, string> = {
  down_bad: "DOWN BAD",
  npc: "NPC",
  "6_7": "6 — 7",
  cooking: "COOKING",
  him_her: "HIM / HER",
  sigma: "SIGMA",
  mog_god: "MOG GOD",
  skibidi: "SKIBIDI",
};

export default function TierBadge({
  tier,
  rank,
  name,
  range,
  size = "lg",
}: TierBadgeProps) {
  const key: TierKey =
    typeof tier === "string" && !(tier in RANK_FOR)
      ? tierKeyFromName(tier)
      : (tier as TierKey);
  const _rank = rank ?? RANK_FOR[key];
  const _name = name ?? NAME_FOR[key];
  const _range = range ?? RANGE_FOR[key];

  switch (key) {
    case "down_bad":  return <DownBad rank={_rank} name={_name} range={_range} size={size} />;
    case "npc":       return <NPC rank={_rank} name={_name} range={_range} size={size} />;
    case "6_7":       return <SixSeven rank={_rank} name={_name} range={_range} size={size} />;
    case "cooking":   return <Cooking rank={_rank} name={_name} range={_range} size={size} />;
    case "him_her":   return <HimHer rank={_rank} name={_name} range={_range} size={size} />;
    case "sigma":     return <Sigma rank={_rank} name={_name} range={_range} size={size} />;
    case "mog_god":   return <MogGod rank={_rank} name={_name} range={_range} size={size} />;
    case "skibidi":   return <Skibidi rank={_rank} name={_name} range={_range} size={size} />;
  }
}

// ─── Shared scaffolding ────────────────────────────────────────────────

interface VariantProps {
  rank: string;
  name: string;
  range: string;
  size: "lg" | "sm";
}

const sizes = {
  lg: { num: 36, name: 14, range: 9, padV: 14, padH: 14, minH: 122 },
  sm: { num: 22, name: 11, range: 8, padV: 8,  padH: 10, minH: 64 },
};

// Horizontal scanlines overlay (multiple Views as a hack since RN can't do
// repeating-linear-gradient natively).
function Scanlines({ density = 4, color = "rgba(0,0,0,0.25)", multiply = false }: {
  density?: number; color?: string; multiply?: boolean;
}) {
  const lines = Math.ceil(200 / density);
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: multiply ? 0.6 : 1 }]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: i * density,
            height: 1,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

// Diagonal hazard-tape stripes — react-native-svg pattern.
function DiagonalStripes({ width, height, fillColor = "rgba(10,10,10,0.18)" }: {
  width: number; height: number; fillColor?: string;
}) {
  const stripeWidth = 14;
  const stripes: React.ReactElement[] = [];
  // Stripes drawn diagonally across the box.
  const total = Math.ceil((width + height) / stripeWidth);
  for (let i = 0; i < total; i++) {
    const x = i * stripeWidth - height;
    stripes.push(
      <Path
        key={i}
        d={`M ${x} ${height} L ${x + stripeWidth / 2} 0 L ${x + stripeWidth} 0 L ${x + stripeWidth / 2} ${height} Z`}
        fill={fillColor}
      />
    );
  }
  return <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">{stripes}</Svg>;
}

// ─── Tier 1 — DOWN BAD ─────────────────────────────────────────────────

function DownBad({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={[styles.box, { backgroundColor: "#1A0606", borderColor: COLORS.border, padding: s.padH, paddingVertical: s.padV, minHeight: s.minH }]}>
      <Scanlines density={5} color="rgba(255,59,48,0.08)" />
      <View>
        <Text style={[styles.num, { fontSize: s.num, color: "#4a1a1a" }]}>{rank}</Text>
        <Text style={[styles.name, { fontSize: s.name, color: "#6b3c3c" }]}>{name}</Text>
      </View>
      <Text style={[styles.range, { fontSize: s.range, color: COLORS.blood }]}>{range}</Text>
    </View>
  );
}

// ─── Tier 2 — NPC ──────────────────────────────────────────────────────

function NPC({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={[styles.box, { backgroundColor: "#2a2a26", borderColor: COLORS.border, padding: s.padH, paddingVertical: s.padV, minHeight: s.minH }]}>
      <Scanlines density={4} color="rgba(0,0,0,0.25)" multiply />
      <View>
        <Text style={[styles.num, { fontSize: s.num, color: "#6b6b5e" }]}>{rank}</Text>
        <Text style={[styles.name, { fontSize: s.name, color: "#8a8878" }]}>{name}</Text>
      </View>
      <Text style={[styles.range, { fontSize: s.range, color: "#8a8878" }]}>{range}</Text>
    </View>
  );
}

// ─── Tier 3 — 6 / 7 ────────────────────────────────────────────────────

function SixSeven({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={[styles.box, { backgroundColor: "#2a1f0e", borderColor: "#4a3818", padding: s.padH, paddingVertical: s.padV, minHeight: s.minH }]}>
      <View>
        <Text style={[styles.num, { fontSize: s.num, color: "#C9A14A" }]}>{rank}</Text>
        <Text style={[styles.name, { fontSize: s.name, color: "#e8be62" }]}>{name}</Text>
      </View>
      <Text style={[styles.range, { fontSize: s.range, color: "#C9A14A" }]}>{range}</Text>
    </View>
  );
}

// ─── Tier 4 — COOKING ──────────────────────────────────────────────────

function Cooking({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={[styles.box, { borderColor: "#FF7B2A", padding: 0, minHeight: s.minH, overflow: "hidden" }]}>
      <LinearGradient
        colors={["#FFB84D", "#FF7B2A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Hazard-tape top stripe (4px) — diagonal stripe via SVG */}
      <View style={{ height: 4, overflow: "hidden" }}>
        <Svg width={400} height={4} pointerEvents="none">
          {Array.from({ length: 50 }).map((_, i) => (
            <Path
              key={i}
              d={`M ${i * 12} 4 L ${i * 12 + 6} 0 L ${i * 12 + 12} 0 L ${i * 12 + 6} 4 Z`}
              fill={COLORS.ink}
            />
          ))}
        </Svg>
      </View>
      <View style={{ flex: 1, justifyContent: "space-between", padding: s.padH, paddingVertical: s.padV }}>
        <View>
          <Text style={[styles.num, { fontSize: s.num, color: COLORS.ink }]}>{rank}</Text>
          <Text style={[styles.name, { fontSize: s.name, color: COLORS.ink }]}>{name}</Text>
        </View>
        <Text style={[styles.range, { fontSize: s.range, color: COLORS.ink, opacity: 0.7 }]}>{range}</Text>
      </View>
    </View>
  );
}

// ─── Tier 5 — HIM / HER ────────────────────────────────────────────────

function HimHer({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={{ position: "relative" }}>
      {/* Outer ink rim */}
      <View style={{ borderWidth: 2, borderColor: COLORS.ink, borderRadius: 0 }}>
        <View style={[styles.box, { backgroundColor: COLORS.hazard, borderColor: COLORS.hazard, padding: s.padH, paddingVertical: s.padV, minHeight: s.minH }]}>
          <Text style={styles.starStamp}>★</Text>
          <View>
            <Text style={[styles.num, { fontSize: s.num + 6, color: COLORS.ink }]}>{rank}</Text>
            <Text style={[styles.name, { fontSize: s.name + 1, color: COLORS.ink }]}>{name}</Text>
          </View>
          <Text style={[styles.range, { fontSize: s.range, color: COLORS.ink, opacity: 0.8 }]}>{range}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tier 6 — SIGMA ────────────────────────────────────────────────────

function Sigma({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={[styles.haloHazard]}>
      {/* Outer ink rim */}
      <View style={{ borderWidth: 2, borderColor: COLORS.ink }}>
        <View style={[styles.box, { backgroundColor: COLORS.hazard, borderColor: COLORS.ink, padding: s.padH, paddingVertical: s.padV, minHeight: s.minH, overflow: "hidden" }]}>
          {/* Diagonal hazard tape pattern */}
          <DiagonalStripes width={400} height={300} fillColor="rgba(10,10,10,0.18)" />
          <Text style={styles.tickerStamp}>▌▌</Text>
          <View>
            <Text style={[styles.num, { fontSize: s.num + 8, color: COLORS.ink }]}>{rank}</Text>
            <Text style={[styles.name, { fontSize: s.name + 2, color: COLORS.ink, fontWeight: "bold" }]}>{name}</Text>
          </View>
          <Text style={[styles.range, { fontSize: s.range, color: COLORS.ink }]}>{range}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Tier 7 — MOG GOD ──────────────────────────────────────────────────

function MogGod({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];
  return (
    <View style={styles.haloHeat}>
      <View style={{ borderWidth: 2, borderColor: COLORS.ink }}>
        <View style={[styles.box, { borderColor: COLORS.hazard, padding: 0, minHeight: s.minH, overflow: "hidden" }]}>
          {/* Radial heat — fake with stacked LinearGradients (RN doesn't do
              radial gradient natively; this approximates from-top-center). */}
          <LinearGradient
            colors={["#FFE74A", "#FF8A1A", "#C42600", "#2A0500"]}
            locations={[0, 0.3, 0.6, 1]}
            start={{ x: 0.5, y: 0.6 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={{ flex: 1, justifyContent: "space-between", padding: s.padH, paddingVertical: s.padV }}>
            <Text style={styles.heatStamp}>◉ HEAT</Text>
            <View>
              <Text style={[
                styles.num,
                {
                  fontSize: s.num + 10,
                  color: "#FFF6D1",
                  textShadowColor: "rgba(255,200,40,0.9)",
                  textShadowRadius: 8,
                  textShadowOffset: { width: 0, height: 0 },
                },
              ]}>{rank}</Text>
              <Text style={[
                styles.name,
                {
                  fontSize: s.name + 2,
                  color: "#FFF6D1",
                  textShadowColor: "rgba(255,180,40,0.8)",
                  textShadowRadius: 6,
                  textShadowOffset: { width: 0, height: 0 },
                },
              ]}>{name}</Text>
            </View>
            <Text style={[styles.range, { fontSize: s.range, color: COLORS.hazard }]}>{range}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Tier 8 — SKIBIDI ──────────────────────────────────────────────────

const HOLO_COLORS: readonly [string, string, ...string[]] = [
  "#FF00C8", "#FFD60A", "#00F0FF", "#7FFFA1", "#FFD60A", "#FF3B30", "#FF00C8",
];

function Skibidi({ rank, name, range, size }: VariantProps) {
  const s = sizes[size];

  // Animations: holo sweep, judder, chroma split on number, scan position, glitch flicker
  const holo     = useRef(new Animated.Value(0)).current;
  const judderX  = useRef(new Animated.Value(0)).current;
  const judderY  = useRef(new Animated.Value(0)).current;
  const chroma   = useRef(new Animated.Value(0)).current;
  const scanY    = useRef(new Animated.Value(0)).current;
  const flicker  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const holoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(holo, { toValue: 1, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(holo, { toValue: 0, duration: 3400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const chromaLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(chroma, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(chroma, { toValue: 0, duration: 90, useNativeDriver: true }),
      ])
    );
    const scanLoop = Animated.loop(
      Animated.timing(scanY, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true })
    );
    const flickLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, { toValue: 0.55, duration: 550, useNativeDriver: true }),
        Animated.timing(flicker, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );

    const judderId = setInterval(() => {
      Animated.parallel([
        Animated.timing(judderX, { toValue: (Math.random() - 0.5) * 1, duration: 80, useNativeDriver: true }),
        Animated.timing(judderY, { toValue: (Math.random() - 0.5) * 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }, 160);

    [holoLoop, chromaLoop, scanLoop, flickLoop].forEach((a) => a.start());

    return () => {
      [holoLoop, chromaLoop, scanLoop, flickLoop].forEach((a) => a.stop());
      clearInterval(judderId);
    };
  }, [holo, chroma, scanY, flicker, judderX, judderY]);

  const chromaXMagenta = chroma.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] });
  const chromaXCyan = chroma.interpolate({ inputRange: [0, 1], outputRange: [2, -2] });
  const holoTranslateX = holo.interpolate({ inputRange: [0, 1], outputRange: [-200, 200] });

  return (
    <Animated.View
      style={[
        styles.haloHolo,
        { transform: [{ translateX: judderX }, { translateY: judderY }] },
      ]}
    >
      {/* Multi-layer "stacked rim" effect — paper outer, ink, hazard, ink */}
      <View style={{ borderWidth: 2, borderColor: COLORS.paper }}>
        <View style={{ borderWidth: 1, borderColor: COLORS.ink }}>
          <View style={{ borderWidth: 2, borderColor: COLORS.hazard }}>
            <View style={{ borderWidth: 2, borderColor: COLORS.ink }}>
              <View style={[styles.box, { borderColor: COLORS.paper, padding: 0, minHeight: s.minH, overflow: "hidden" }]}>
                {/* Holographic gradient — animated translate */}
                <Animated.View style={[
                  StyleSheet.absoluteFillObject,
                  { transform: [{ translateX: holoTranslateX }] },
                ]}>
                  <LinearGradient
                    colors={HOLO_COLORS}
                    locations={[0, 0.18, 0.38, 0.55, 0.72, 0.88, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: 600, height: "100%" }}
                  />
                </Animated.View>
                {/* Hazard tape top (5px) */}
                <View style={{ height: 5, overflow: "hidden" }}>
                  <Svg width={400} height={5} pointerEvents="none">
                    {Array.from({ length: 60 }).map((_, i) => (
                      <Path
                        key={i}
                        d={`M ${i * 12} 5 L ${i * 12 + 6} 0 L ${i * 12 + 12} 0 L ${i * 12 + 6} 5 Z`}
                        fill={COLORS.ink}
                      />
                    ))}
                  </Svg>
                </View>
                {/* Animated scanlines */}
                <Animated.View style={[
                  StyleSheet.absoluteFillObject,
                  {
                    transform: [{ translateY: scanY.interpolate({ inputRange: [0, 1], outputRange: [0, 4] }) }],
                  },
                ]}>
                  <Scanlines density={4} color="rgba(0,0,0,0.18)" />
                </Animated.View>

                <View style={{ flex: 1, justifyContent: "space-between", padding: s.padH, paddingVertical: s.padV }}>
                  {/* GLITCH stamp */}
                  <Animated.View style={[styles.glitchStamp, { opacity: flicker, transform: [{ rotate: "4deg" }] }]}>
                    <Text style={styles.glitchStampText}>▓ GLITCH</Text>
                  </Animated.View>

                  <View style={styles.chromaWrap}>
                    {/* Magenta layer */}
                    <Animated.Text
                      style={[
                        styles.num,
                        { fontSize: s.num + 14, color: "#FF00C8", position: "absolute", transform: [{ translateX: chromaXMagenta }] },
                      ]}
                    >
                      {rank}
                    </Animated.Text>
                    {/* Cyan layer */}
                    <Animated.Text
                      style={[
                        styles.num,
                        { fontSize: s.num + 14, color: "#00F0FF", position: "absolute", transform: [{ translateX: chromaXCyan }] },
                      ]}
                    >
                      {rank}
                    </Animated.Text>
                    {/* Top paper layer */}
                    <Text style={[styles.num, { fontSize: s.num + 14, color: COLORS.paper, textShadowColor: "rgba(255,255,255,0.9)", textShadowRadius: 4, textShadowOffset: { width: 0, height: 0 } }]}>
                      {rank}
                    </Text>
                  </View>

                  {/* Name in ink badge with chromatic shadow */}
                  <View style={styles.skibidiNameWrap}>
                    <View style={styles.skibidiNameBadge}>
                      <Text style={[styles.name, { fontSize: s.name + 1, color: COLORS.hazard }]}>
                        {name}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.skibidiRangeWrap}>
                    <Text style={[styles.range, { fontSize: s.range, color: COLORS.paper, backgroundColor: COLORS.ink, paddingHorizontal: 4, paddingVertical: 1 }]}>
                      {range}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  box: {
    position: "relative",
    borderWidth: 1,
    overflow: "hidden",
    justifyContent: "space-between",
  },

  num: {
    fontFamily: FONTS.display,
    letterSpacing: -1.5,
    paddingTop: 2,
  },
  name: {
    fontFamily: FONTS.display,
    letterSpacing: 0.3,
    paddingTop: 2,
    textTransform: "uppercase",
  },
  range: {
    fontFamily: FONTS.monoBold,
    letterSpacing: 2,
    marginTop: 4,
  },

  // Stamps
  starStamp: {
    position: "absolute",
    top: 8,
    right: 10,
    fontFamily: FONTS.display,
    fontSize: 14,
    color: COLORS.ink,
    zIndex: 5,
  },
  tickerStamp: {
    position: "absolute",
    top: 8,
    right: 10,
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.ink,
    zIndex: 5,
  },
  heatStamp: {
    position: "absolute",
    top: 8,
    right: 10,
    fontFamily: FONTS.monoBold,
    fontSize: 8,
    letterSpacing: 1.6,
    color: "#FFF6D1",
    textShadowColor: "rgba(255,180,40,0.9)",
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 0 },
    zIndex: 5,
  },
  glitchStamp: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 6,
    paddingVertical: 3,
    zIndex: 5,
  },
  glitchStampText: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    color: COLORS.hazard,
    letterSpacing: 1.4,
  },

  // Halo containers (use shadow as glow approximation)
  haloHazard: {
    shadowColor: COLORS.hazard,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
  },
  haloHeat: {
    shadowColor: "#FF8A1A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 19,
  },
  haloHolo: {
    shadowColor: "#FF00C8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
  },

  // Skibidi-specific
  chromaWrap: {
    position: "relative",
    height: 50,
    justifyContent: "flex-start",
  },
  skibidiNameWrap: {
    flexDirection: "row",
  },
  skibidiNameBadge: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: 6,
    paddingVertical: 3,
    // Chromatic shadow approximation
    shadowColor: "#FF00C8",
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  skibidiRangeWrap: {
    flexDirection: "row",
    marginTop: 4,
  },
});
