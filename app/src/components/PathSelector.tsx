import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { COLORS, SPACING } from "../constants/theme";
import { SIGMA_PATHS } from "../constants/paths";

interface PathSelectorProps {
  selectedPath: string;
  onSelect: (pathId: string) => void;
}

export default function PathSelector({
  selectedPath,
  onSelect,
}: PathSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {SIGMA_PATHS.map((path) => {
        const isSelected = path.id === selectedPath;
        return (
          <TouchableOpacity
            key={path.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(path.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.emoji}>{path.emoji}</Text>
            <Text
              style={[styles.label, isSelected && styles.labelSelected]}
              numberOfLines={1}
            >
              {path.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 20,
    gap: SPACING.xs,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  labelSelected: {
    color: COLORS.textPrimary,
  },
});
