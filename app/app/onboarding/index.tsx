import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { COLORS, SPACING, FONTS, displayText } from "../../src/constants/theme";

// Splash screen — first run after install. Slam-cuts to the notifications
// primer on ENTER. Brutalist editorial frame: big MOGSTER. wordmark, hazard
// tape, station metadata corners, 16+ disclaimer.
// Spec: docs/design/system/project/ui_kits/mogster_app/screens.jsx Screen 01.

export default function SplashScreen() {
  const router = useRouter();

  const onEnter = () => {
    // Typed routes regenerate during EAS build; cast for standalone tsc.
    router.push("/onboarding/notifications" as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Hazard tape stripe top — flat hazard band (RN can't do diagonal repeat) */}
      <View style={styles.hazardTape} />

      {/* Center: big wordmark + tagline */}
      <View style={styles.center}>
        <Text style={styles.wordmark}>
          MOG{"\n"}STER<Text style={styles.wordmarkDot}>.</Text>
        </Text>
        <Text style={styles.tagline}>your aura. rated. no cap.</Text>
      </View>

      {/* Metadata corners */}
      <View style={styles.metaLeft}>
        <Text style={styles.metaText}>AURA</Text>
        <Text style={styles.metaText}>MEASUREMENT</Text>
        <Text style={styles.metaText}>STATION</Text>
      </View>
      <View style={styles.metaRight}>
        <Text style={[styles.metaText, styles.metaRightText]}>ISSUE</Text>
        <Text style={[styles.metaText, styles.metaRightText]}>N°01</Text>
        <Text style={[styles.metaText, styles.metaRightText]}>2026</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.cta}
          onPress={onEnter}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaLabel}>ENTER</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          16+ ONLY · WE DON&apos;T SERVE MINORS FR FR
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },

  hazardTape: {
    height: 18,
    backgroundColor: COLORS.hazard,
    marginTop: 8,
  },

  center: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.s2x,
    justifyContent: "flex-start",
    marginTop: SPACING.xl,
  },
  wordmark: {
    ...displayText(92),
    color: COLORS.paper,
    letterSpacing: -3,
    textTransform: "uppercase",
    lineHeight: 78,
  },
  wordmarkDot: {
    color: COLORS.hazard,
  },
  tagline: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.paperMute,
    letterSpacing: 0.5,
    marginTop: SPACING.md,
  },

  metaLeft: {
    position: "absolute",
    bottom: 200,
    left: SPACING.lg,
  },
  metaRight: {
    position: "absolute",
    bottom: 200,
    right: SPACING.lg,
    alignItems: "flex-end",
  },
  metaText: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    color: COLORS.ghost,
    letterSpacing: 2.8,
    lineHeight: 16,
  },
  metaRightText: {
    textAlign: "right",
  },

  ctaWrap: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  cta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.hazard,
    paddingVertical: 18,
    paddingHorizontal: SPACING.md,
  },
  ctaLabel: {
    ...displayText(26),
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  ctaArrow: {
    fontFamily: FONTS.display,
    fontSize: 26,
    color: COLORS.ink,
  },
  disclaimer: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.ghost,
    letterSpacing: 2.2,
    textAlign: "center",
    marginTop: 12,
  },
});
