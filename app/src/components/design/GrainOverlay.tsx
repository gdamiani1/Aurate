import React, { useMemo } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

/**
 * Grain/noise overlay. Place absolutely over any dark surface to add texture.
 * Uses a pointerEvents="none" wrapper so it never blocks touches.
 *
 * Implementation note: React Native SVG does not support <filter> /
 * <feTurbulence>, so we fake grain by sprinkling tiny semi-transparent
 * dots in a deterministic grid. Cheap and good enough for editorial vibe.
 */
interface Props {
  opacity?: number;
  style?: StyleProp<ViewStyle>;
  /** Dot density — higher = more specks. Default 60. */
  density?: number;
}

// Deterministic pseudo-random — same layout each render
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function GrainOverlay({ opacity = 0.08, style, density = 60 }: Props) {
  const specks = useMemo(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: density }).map((_, i) => ({
      key: i,
      top: `${(rand() * 100).toFixed(2)}%`,
      left: `${(rand() * 100).toFixed(2)}%`,
      size: rand() < 0.7 ? 1 : 2,
      o: 0.3 + rand() * 0.7,
    }));
  }, [density]);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }, style]}>
      {specks.map((s) => (
        <View
          key={s.key}
          style={{
            position: "absolute",
            top: s.top as any,
            left: s.left as any,
            width: s.size,
            height: s.size,
            backgroundColor: "#F5F1E6",
            opacity: s.o,
          }}
        />
      ))}
    </View>
  );
}
