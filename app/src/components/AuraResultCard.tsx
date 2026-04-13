import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING } from "../constants/theme";

interface AuraResult {
  aura_score: number;
  personality_read: string;
  roast: string;
  aura_color: { primary: string; secondary: string };
  tier: string;
}

interface AuraResultCardProps {
  result: AuraResult;
}

export default function AuraResultCard({ result }: AuraResultCardProps) {
  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just got ${result.aura_score} aura (${result.tier}) on Aurate.\n\n"${result.roast}"\n\nGet your aura checked fr fr`,
      });
    } catch (_) {
      // user cancelled
    }
  };

  return (
    <LinearGradient
      colors={[result.aura_color.primary, result.aura_color.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{result.aura_score}</Text>
        <Text style={styles.scoreLabel}>AURA</Text>
      </View>

      <View style={styles.tierBadge}>
        <Text style={styles.tierText}>{result.tier}</Text>
      </View>

      <Text style={styles.personalityRead}>{result.personality_read}</Text>

      <View style={styles.roastBox}>
        <Text style={styles.roastQuote}>&ldquo;</Text>
        <Text style={styles.roastText}>{result.roast}</Text>
        <Text style={styles.roastQuote}>&rdquo;</Text>
      </View>

      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Text style={styles.shareButtonText}>Post the W</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    alignItems: "center",
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  score: {
    fontSize: 72,
    fontWeight: "900",
    color: COLORS.textPrimary,
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 4,
    marginTop: -SPACING.xs,
  },
  tierBadge: {
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    marginBottom: SPACING.lg,
  },
  tierText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  personalityRead: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  roastBox: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  roastQuote: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 24,
    fontWeight: "700",
  },
  roastText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
    textAlign: "center",
    flex: 1,
  },
  shareButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md - 2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  shareButtonText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});
