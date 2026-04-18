import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Image,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, FONTS } from "../constants/theme";
import GrainOverlay from "./design/GrainOverlay";
import CropMarks from "./design/CropMarks";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - SPACING.lg * 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9));

// ─── Lazy view-shot + media-library ───
// These use TurboModuleRegistry.getEnforcing which can fail on legacy bridge.
// If they fail to load, share/download fall back gracefully.
let captureRefFn: any = null;
let MediaLibrary: any = null;
try {
  captureRefFn = require("react-native-view-shot").captureRef;
} catch {}
try {
  MediaLibrary = require("expo-media-library");
} catch {}

interface AuraStat {
  label: string;
  score: number;
}

interface AuraResult {
  aura_score: number;
  personality_read: string;
  roast: string;
  aura_color: { primary: string; secondary: string };
  tier: string;
  stats?: AuraStat[];
}

interface AuraResultCardProps {
  result: AuraResult;
  imageUri?: string | null;
  sigmaPath?: string;
  username?: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

function getTierTreatment(tier: string): { color: string; label: string } {
  const upper = tier.toUpperCase();
  if (upper.includes("SKIBIDI")) return { color: "#FFFFFF", label: "SKIBIDI LEGEND" };
  if (upper.includes("MOG GOD")) return { color: COLORS.primary, label: "MOG GOD" };
  if (upper.includes("SIGMA")) return { color: COLORS.primary, label: "SIGMA" };
  if (upper.includes("HIM") || upper.includes("HER")) return { color: COLORS.primary, label: "HIM / HER" };
  if (upper.includes("COOK")) return { color: "#FFB84D", label: "COOKING" };
  if (upper.includes("6") || upper.includes("SEVEN")) return { color: "#C9A14A", label: "SIX — SEVEN" };
  if (upper.includes("NPC")) return { color: "#8A8878", label: "NPC" };
  return { color: "#6B6B5E", label: "DOWN BAD" };
}

function pathStamp(path?: string): string {
  if (!path) return "• AURAMAXXING";
  const map: Record<string, string> = {
    auramaxxing: "• AURAMAXXING",
    looksmaxxing: "• LOOKSMAXXING",
    mogger_mode: "• MOGGER MODE",
    rizzmaxxing: "• RIZZMAXXING",
    statusmaxxing: "• STATUSMAXXING",
    brainrot_mode: "• BRAINROT MODE",
    sigma_grindset: "• SIGMA GRIND",
  };
  return map[path] ?? path.toUpperCase();
}

function issueNumber(score: number): string {
  const day = new Date();
  const seed = score + day.getDate() * 37 + day.getMonth() * 101;
  return `#${String(seed).padStart(5, "0")}`;
}

function todayStamp(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}.${String(d.getFullYear()).slice(2)}`;
}

export default function AuraResultCard({
  result,
  imageUri,
  sigmaPath,
  username,
  isSaved,
  onToggleSave,
}: AuraResultCardProps) {
  const cardRef = useRef<View>(null);
  const [view, setView] = useState<"roast" | "stats">("roast");
  const hasStats = Array.isArray(result.stats) && result.stats.length > 0;
  const tierTreatment = getTierTreatment(result.tier);

  const captureCard = async (): Promise<string | null> => {
    try {
      if (!captureRefFn || !cardRef.current) return null;
      return await captureRefFn(cardRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
    } catch (e) {
      console.warn("Card capture failed:", e);
      return null;
    }
  };

  const handleShare = async () => {
    const uri = await captureCard();
    const message = `I scored ${result.aura_score} on Mogster — ${result.tier}\n\n"${result.roast}"`;
    try {
      if (uri) {
        await Share.share({ url: uri, message });
      } else {
        await Share.share({ message });
      }
    } catch (_) {}
  };

  const handleDownload = async () => {
    try {
      if (!MediaLibrary) {
        Alert.alert("Not available", "Camera roll access not available.");
        return;
      }
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Need access", "Allow camera roll to save the card");
        return;
      }
      const uri = await captureCard();
      if (!uri) {
        Alert.alert("L detected", "Couldn't capture card. Try a screenshot instead.");
        return;
      }
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("W secured", "Card saved to your camera roll");
    } catch (_) {
      Alert.alert("L detected", "Failed to save card");
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Card — ref for capture */}
      <View ref={cardRef} collapsable={false} style={styles.captureArea}>
        <View style={styles.card}>
          {/* Photo — sits in top 65% so face is visible above text */}
          {imageUri && (
            <Image
              source={{ uri: imageUri }}
              style={styles.photo}
              resizeMode="cover"
            />
          )}

          {/* Gradient — starts lower so more image is visible */}
          <LinearGradient
            colors={[
              "transparent",
              "rgba(10,10,10,0.6)",
              "rgba(10,10,10,0.92)",
              COLORS.bgCard,
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={styles.gradient}
          />

          <GrainOverlay opacity={0.06} />
          <CropMarks color={COLORS.primary} size={18} inset={14} opacity={0.5} />

          {/* Top metadata */}
          <View style={styles.topStrip}>
            <View style={styles.pathStamp}>
              <Text style={styles.pathStampText}>{pathStamp(sigmaPath)}</Text>
            </View>
            <View style={styles.issueStamp}>
              <Text style={styles.issueNumber}>{issueNumber(result.aura_score)}</Text>
              <Text style={styles.issueDate}>{todayStamp()}</Text>
            </View>
          </View>

          {/* Bottom editorial block — compact to leave more room for photo */}
          <View style={styles.bottomBlock}>
            <View style={styles.tierRow}>
              <Text style={[styles.tierLabel, { color: tierTreatment.color }]}>
                {tierTreatment.label}
              </Text>
              <View style={[styles.tierLine, { backgroundColor: tierTreatment.color }]} />
            </View>

            <View style={styles.scoreRow}>
              <Text
                style={[styles.megaScore, { color: tierTreatment.color }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {String(result.aura_score)}
              </Text>
              <Text style={styles.auraTag}>AURA</Text>
            </View>

            {view === "roast" ? (
              <View style={styles.roastBlock}>
                <Text style={styles.roast}>
                  <Text style={styles.quoteMark}>" </Text>
                  {result.roast.toUpperCase()}
                  <Text style={styles.quoteMark}> "</Text>
                </Text>
                {result.personality_read ? (
                  <Text style={styles.personalityRead}>
                    {result.personality_read}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.statsBlock}>
                {(result.stats || []).map((stat) => (
                  <View key={stat.label} style={styles.statRow}>
                    <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
                    <View style={styles.statBarBg}>
                      <View
                        style={[
                          styles.statBarFill,
                          { width: `${stat.score}%`, backgroundColor: tierTreatment.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.statVal, { color: tierTreatment.color }]}>
                      {stat.score}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerUser}>{username ? `@${username}` : ""}</Text>
              <Text style={styles.footerBrand}>MOGSTER / ISSUE 01</Text>
            </View>
          </View>
        </View>
      </View>

      {/* View toggle */}
      {hasStats && (
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, view === "roast" && styles.toggleBtnActive]}
            onPress={() => setView("roast")}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, view === "roast" && styles.toggleTextActive]}>
              ROAST
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, view === "stats" && styles.toggleBtnActive]}
            onPress={() => setView("stats")}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, view === "stats" && styles.toggleTextActive]}>
              STATS
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {onToggleSave && (
          <TouchableOpacity
            style={[
              styles.iconBtn,
              isSaved && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
            ]}
            onPress={onToggleSave}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.iconBtnIcon,
                { color: isSaved ? COLORS.bg : COLORS.textSecondary },
              ]}
            >
              {isSaved ? "★" : "☆"}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnIcon}>↗</Text>
          <Text style={styles.primaryBtnText}>SHARE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          <Text style={[styles.iconBtnIcon, { color: COLORS.textSecondary }]}>↓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },

  captureArea: {
    width: CARD_WIDTH,
    overflow: "hidden",
  },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: COLORS.bgCard,
    position: "relative",
    overflow: "hidden",
  },

  // Photo sits in top portion, bleeds past midpoint into the gradient zone
  photo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "75%",
  },

  // Gradient only covers bottom portion where text lives
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "55%",
  },

  topStrip: {
    position: "absolute",
    top: SPACING.lg + 4,
    left: SPACING.lg + 4,
    right: SPACING.lg + 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 4,
  },
  pathStamp: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    transform: [{ rotate: "-2deg" }],
  },
  pathStampText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.bg,
    letterSpacing: 1.2,
  },
  issueStamp: {
    alignItems: "flex-end",
  },
  issueNumber: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.primary,
  },
  issueDate: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: COLORS.primary,
    opacity: 0.7,
  },

  bottomBlock: {
    position: "absolute",
    bottom: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 4,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: -4,
  },
  tierLabel: {
    fontFamily: FONTS.display,
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  tierLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },

  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 2,
    marginTop: -8,
  },
  megaScore: {
    fontFamily: FONTS.display,
    fontSize: 80,
    letterSpacing: -2,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  auraTag: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 2,
    marginLeft: 14,
  },

  roastBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.2)",
    paddingVertical: 8,
    marginBottom: 6,
  },
  roast: {
    fontFamily: FONTS.display,
    fontSize: 14,
    lineHeight: 17,
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  quoteMark: {
    color: COLORS.primary,
    fontSize: 16,
  },
  personalityRead: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(245,241,230,0.72)",
    marginTop: 6,
    letterSpacing: 0.2,
  },

  statsBlock: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.2)",
    paddingVertical: 8,
    marginBottom: 6,
    gap: 4,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: "rgba(245,241,230,0.65)",
    letterSpacing: 0.8,
    width: 84,
  },
  statBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255, 214, 10, 0.1)",
  },
  statBarFill: {
    height: "100%",
  },
  statVal: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    width: 24,
    textAlign: "right",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerUser: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: "rgba(245,241,230,0.45)",
    letterSpacing: 1.5,
  },
  footerBrand: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: "rgba(255, 214, 10, 0.5)",
    letterSpacing: 1.5,
  },

  viewToggle: {
    flexDirection: "row",
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: "center",
  },
  toggleBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  toggleTextActive: {
    color: COLORS.bg,
  },

  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.md,
    alignItems: "center",
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderWidth: 1,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  primaryBtnIcon: {
    fontFamily: FONTS.monoBold,
    fontSize: 18,
    color: COLORS.bg,
  },
  primaryBtnText: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    letterSpacing: 2.5,
    color: COLORS.bg,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bgCard,
  },
  iconBtnIcon: {
    fontSize: 22,
    fontFamily: FONTS.monoBold,
  },
});
