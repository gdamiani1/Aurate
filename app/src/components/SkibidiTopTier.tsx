import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import { capture } from "../lib/analytics";

// "SKIBIDI ALERT" — the rare-max state when score === 1000.
// Multi-layer animated treatment: holographic gradient sweep, RGB chroma
// split on the number, physical judder, hazard tape header, GLITCH stamp.
// Spec: docs/design/system/project/preview/colors-tiers.html (T8 SKIBIDI)
//      + ui_kits/mogster_app/screens.jsx Screen 13.

let MediaLibrary: any = null;
try {
  MediaLibrary = require("expo-media-library");
} catch {}

const { width: SCREEN_W } = Dimensions.get("window");

interface SkibidiTopTierProps {
  score: number;
  roast: string;
  username?: string;
  sigmaPath?: string;
  onContinue?: () => void;
}

const HOLO_COLORS: readonly [string, string, ...string[]] = [
  "#FF00C8",
  "#FFD60A",
  "#00F0FF",
  "#7FFFA1",
  "#FFD60A",
  "#FF3B30",
  "#FF00C8",
];

export default function SkibidiTopTier({
  score,
  roast,
  username,
  sigmaPath,
  onContinue,
}: SkibidiTopTierProps) {
  // Holographic gradient sweep — translate the wide gradient horizontally
  const holoX = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(holoX, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(holoX, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [holoX]);

  // RGB chroma split — alternate offsets every 180ms
  const chromaPhase = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(chromaPhase, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(chromaPhase, { toValue: 0, duration: 90, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [chromaPhase]);

  // Physical judder — translates 0.5px in random directions
  const judderX = useRef(new Animated.Value(0)).current;
  const judderY = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setInterval(() => {
      Animated.parallel([
        Animated.timing(judderX, {
          toValue: (Math.random() - 0.5) * 1.2,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(judderY, {
          toValue: (Math.random() - 0.5) * 1.2,
          duration: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, 160);
    return () => clearInterval(id);
  }, [judderX, judderY]);

  // GLITCH stamp flicker
  const stampFlicker = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(stampFlicker, { toValue: 0.55, duration: 550, useNativeDriver: true }),
        Animated.timing(stampFlicker, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [stampFlicker]);

  const chromaXMagenta = chromaPhase.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] });
  const chromaXCyan = chromaPhase.interpolate({ inputRange: [0, 1], outputRange: [2, -2] });

  const onShare = async () => {
    const message = `I scored 1000 on Mogster — SKIBIDI TIER\n\n"${roast}"`;
    try {
      await Share.share({ message });
      capture("card_shared", { score, tier: "Skibidi Legendary", sigma_path: sigmaPath, skibidi_alert: true });
    } catch (_) {}
  };

  const onSave = async () => {
    if (!MediaLibrary) {
      Alert.alert("Not available", "Camera roll access not available.");
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Need access", "Allow camera roll to save the card");
      return;
    }
    Alert.alert("Take a screenshot", "The Skibidi state captures via screenshot — animations make it impossible to flatten cleanly.");
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: judderX },
            { translateY: judderY },
          ],
        },
      ]}
    >
      {/* Holographic gradient — full screen */}
      <Animated.View
        style={[
          styles.holoBg,
          {
            transform: [
              {
                translateX: holoX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-SCREEN_W, SCREEN_W],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={HOLO_COLORS}
          locations={[0, 0.18, 0.38, 0.55, 0.72, 0.88, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.holoGradient}
        />
      </Animated.View>

      {/* Dark overlay so text reads */}
      <View style={styles.dimOverlay} />

      {/* Hazard tape stripe top */}
      <View style={styles.hazardTape} />

      {/* GLITCH stamp top-right */}
      <Animated.View
        style={[
          styles.glitchStamp,
          { opacity: stampFlicker, transform: [{ rotate: "4deg" }] },
        ]}
      >
        <Text style={styles.glitchStampText}>▓ GLITCH</Text>
      </Animated.View>

      {/* SKIBIDI ALERT badge */}
      <View style={styles.alertBadge}>
        <Text style={styles.alertBadgeText}>● SKIBIDI ALERT</Text>
      </View>

      {/* Center stack */}
      <View style={styles.center}>
        <Text style={styles.eyebrow}>▌ AURA · MAX</Text>

        {/* Chroma-split number */}
        <View style={styles.numberStack}>
          <Animated.Text
            style={[
              styles.megaNumberLayer,
              { color: "#FF00C8", transform: [{ translateX: chromaXMagenta }] },
            ]}
          >
            1000
          </Animated.Text>
          <Animated.Text
            style={[
              styles.megaNumberLayer,
              { color: "#00F0FF", transform: [{ translateX: chromaXCyan }] },
            ]}
          >
            1000
          </Animated.Text>
          <Text style={styles.megaNumber}>1000</Text>
        </View>

        <Text style={styles.tierLabel}>SKIBIDI TIER</Text>

        {/* Divider + roast */}
        <View style={styles.divider} />
        <Text style={styles.roast}>
          &quot;{roast.toLowerCase()}&quot;
        </Text>
      </View>

      {/* Bottom actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={onShare}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnPrimaryText}>↗ SHARE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={onSave}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnSecondaryText}>↓ SAVE</Text>
        </TouchableOpacity>
      </View>

      {onContinue && (
        <TouchableOpacity onPress={onContinue} style={styles.dismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>BACK TO STATION →</Text>
        </TouchableOpacity>
      )}

      {username && (
        <Text style={styles.usernameStamp}>@{username.toUpperCase()}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
    overflow: "hidden",
  },

  holoBg: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SCREEN_W * 3,
    opacity: 0.9,
  },
  holoGradient: {
    flex: 1,
  },
  dimOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(10,10,10,0.55)",
  },

  hazardTape: {
    height: 8,
    backgroundColor: COLORS.hazard,
  },

  glitchStamp: {
    position: "absolute",
    top: 24,
    right: 16,
    backgroundColor: COLORS.ink,
    paddingHorizontal: 7,
    paddingVertical: 4,
    zIndex: 5,
  },
  glitchStampText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.hazard,
    letterSpacing: 1.8,
  },

  alertBadge: {
    alignSelf: "flex-start",
    marginTop: SPACING.xl,
    marginLeft: SPACING.lg,
    backgroundColor: COLORS.paper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: "-2deg" }],
  },
  alertBadgeText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.ink,
    letterSpacing: 1.8,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
  },
  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.paper,
    letterSpacing: 3.5,
    marginBottom: 16,
  },

  numberStack: {
    height: 170,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  megaNumber: {
    fontFamily: FONTS.display,
    fontSize: 180,
    lineHeight: 168,
    letterSpacing: -10,
    color: COLORS.paper,
    textShadowColor: "rgba(255,255,255,0.9)",
    textShadowRadius: 16,
    textShadowOffset: { width: 0, height: 0 },
    textTransform: "uppercase",
  },
  megaNumberLayer: {
    position: "absolute",
    fontFamily: FONTS.display,
    fontSize: 180,
    lineHeight: 168,
    letterSpacing: -10,
    textTransform: "uppercase",
  },

  tierLabel: {
    fontFamily: FONTS.display,
    fontSize: 32,
    color: COLORS.paper,
    letterSpacing: 1,
    marginTop: 8,
    textTransform: "uppercase",
  },

  divider: {
    width: "70%",
    height: 1,
    backgroundColor: "rgba(245,241,230,0.4)",
    marginTop: 24,
    marginBottom: 16,
  },
  roast: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.paper,
    lineHeight: 19,
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.paper,
  },
  actionBtnPrimaryText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.ink,
    letterSpacing: 2.5,
  },
  actionBtnSecondary: {
    borderWidth: 1,
    borderColor: COLORS.paper,
  },
  actionBtnSecondaryText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.paper,
    letterSpacing: 2.5,
  },

  dismiss: {
    alignSelf: "center",
    paddingVertical: 16,
    marginBottom: 8,
  },
  dismissText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.paper,
    letterSpacing: 2.2,
    opacity: 0.7,
  },

  usernameStamp: {
    position: "absolute",
    bottom: 16,
    left: 16,
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    color: COLORS.paper,
    letterSpacing: 1.8,
    opacity: 0.4,
  },
});
