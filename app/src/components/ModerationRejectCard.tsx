import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS, FONTS, SPACING } from "../constants/theme";
import {
  REJECT_COPY,
  HARD_LOCKED_COPY,
  CopyTier,
} from "../constants/moderationCopy";

interface ModerationRejectCardProps {
  copyTier: CopyTier;
  hardLocked?: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ModerationRejectCard({
  copyTier,
  hardLocked,
  onRetry,
  onDismiss,
}: ModerationRejectCardProps) {
  const copy = hardLocked ? HARD_LOCKED_COPY : REJECT_COPY[copyTier];
  const useEmailCta = hardLocked || copyTier === "C";

  const handlePrimary = () => {
    if (useEmailCta) {
      Linking.openURL(
        "mailto:help@mogster.app?subject=Mogster%20moderation%20review"
      );
    } else {
      onRetry();
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.stamp}>
        <Text style={styles.stampText}>RETURN TO SENDER</Text>
      </View>

      <Text style={styles.headline}>{copy.headline}</Text>
      <Text style={styles.sub}>{copy.sub}</Text>

      <TouchableOpacity
        style={styles.primary}
        onPress={handlePrimary}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryText}>{copy.ctaPrimary}</Text>
      </TouchableOpacity>

      {(copy.ctaSecondary || useEmailCta) && (
        <TouchableOpacity
          style={styles.secondary}
          onPress={onDismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryText}>
            {copy.ctaSecondary ?? "DISMISS"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: "dashed",
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  stamp: {
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    transform: [{ rotate: "-3deg" }],
    marginBottom: SPACING.md,
  },
  stampText: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 32,
    marginBottom: SPACING.sm,
  },
  sub: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  primary: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  primaryText: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.bg,
    letterSpacing: 1,
  },
  secondary: {
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  secondaryText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
});
