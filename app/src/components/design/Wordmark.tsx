import React from "react";
import { View, Text, StyleSheet, StyleProp, TextStyle } from "react-native";
import { COLORS, FONTS } from "../../constants/theme";

interface Props {
  size?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * MOGSTER. wordmark — condensed Anton with a hazard-yellow period.
 * Replaces the 🌀 emoji as the brand mark.
 */
export default function Wordmark({ size = 42, style }: Props) {
  const base = {
    fontFamily: FONTS.display,
    fontSize: size,
    lineHeight: Math.round(size * 1.15),
    includeFontPadding: false as const,
    paddingTop: Math.round(size * 0.12),
    letterSpacing: -size * 0.02,
  };
  return (
    <View style={styles.row}>
      <Text style={[{ ...base, color: COLORS.textPrimary }, style]}>MOGSTER</Text>
      <Text style={{ ...base, color: COLORS.primary }}>.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-start" },
});
