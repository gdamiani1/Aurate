import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import { getTierForScore } from "../constants/tiers";

interface AuraHistoryItemProps {
  score: number;
  roast: string;
  imageUrl?: string;
  timestamp: string;
  isSaved: boolean;
  onPress: () => void;
  onToggleSave: () => void;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export default function AuraHistoryItem({
  score,
  roast,
  imageUrl,
  timestamp,
  isSaved,
  onPress,
  onToggleSave,
}: AuraHistoryItemProps) {
  const tier = getTierForScore(score);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Real photo thumbnail */}
      <View style={[styles.thumbWrapper, { borderColor: tier.color }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={[styles.thumbScore, { color: tier.color }]}>{score}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={[styles.score, { color: tier.color }]}>{score}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tier.color + "25" }]}>
            <Text style={[styles.tierText, { color: tier.color }]}>{tier.name}</Text>
          </View>
        </View>
        <Text style={styles.roast} numberOfLines={2}>
          {roast}
        </Text>
        <Text style={styles.time}>{timeAgo(timestamp)}</Text>
      </View>

      {/* Save star */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={onToggleSave}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.saveIcon, { color: isSaved ? COLORS.warning : COLORS.textMuted }]}>
          {isSaved ? "★" : "☆"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    backgroundColor: COLORS.bgElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbScore: {
    fontSize: 18,
    fontWeight: "800",
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: 2,
  },
  score: {
    fontSize: 20,
    fontWeight: "900",
  },
  tierBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  roast: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 2,
  },
  time: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  saveBtn: {
    paddingLeft: SPACING.sm,
    paddingRight: 4,
  },
  saveIcon: {
    fontSize: 26,
  },
});
