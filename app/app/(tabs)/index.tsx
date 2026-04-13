import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { COLORS, SPACING } from "../../src/constants/theme";
import { SIGMA_PATHS } from "../../src/constants/paths";
import { useAuthStore } from "../../src/store/authStore";
import AuraResultCard from "../../src/components/AuraResultCard";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
const { width: SCREEN_WIDTH } = Dimensions.get("window");

const LOADING_MESSAGES = [
  "Analyzing your aura fr fr...",
  "Computing the mog differential...",
  "Checking if you're HIM...",
  "The AI is cooking rn...",
  "Calibrating the vibe check...",
];

interface AuraResult {
  aura_score: number;
  personality_read: string;
  roast: string;
  aura_color: { primary: string; secondary: string };
  tier: string;
}

async function checkAura(
  imageUri: string,
  sigmaPath: string,
  userId: string
): Promise<AuraResult> {
  const fileName = imageUri.split("/").pop() || "photo.jpg";
  const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";

  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: fileName,
    type: fileType,
  } as any);

  const response = await fetch(`${API_URL}/aura/check`, {
    method: "POST",
    headers: {
      "x-sigma-path": sigmaPath,
      "x-user-id": userId,
      "Content-Type": "multipart/form-data",
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `API error: ${response.status}`);
  }

  return response.json();
}

export default function VibeCheckScreen() {
  const { profile } = useAuthStore();
  const [selectedPath, setSelectedPath] = useState(
    profile?.current_path || SIGMA_PATHS[0].id
  );
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [result, setResult] = useState<AuraResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!loading) { pulseAnim.setValue(1); return; }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [loading]);

  useEffect(() => {
    if (result) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }).start();
    }
  }, [result]);

  const pickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) { setError("Need camera roll access to check your aura fr"); return; }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (pickerResult.canceled) return;
    const uri = pickerResult.assets[0].uri;
    setImageUri(uri);
    setError(null);
    setResult(null);
    submitAuraCheck(uri);
  };

  const takePhoto = async () => {
    const permResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permResult.granted) { setError("Need camera access to check your aura fr"); return; }
    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (pickerResult.canceled) return;
    const uri = pickerResult.assets[0].uri;
    setImageUri(uri);
    setError(null);
    setResult(null);
    submitAuraCheck(uri);
  };

  const submitAuraCheck = async (uri: string) => {
    setLoading(true);
    setLoadingMsgIndex(0);
    try {
      const userId = profile?.id || "anonymous";
      const data = await checkAura(uri, selectedPath, userId);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong no cap");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImageUri(null);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const handlePathSelect = (pathId: string) => {
    setSelectedPath(pathId);
    useAuthStore.getState().setPath(pathId);
  };

  const selectedPathData = SIGMA_PATHS.find((p) => p.id === selectedPath);

  // ─── RESULT VIEW ───
  if (result && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScrollView contentContainerStyle={styles.resultScroll}>
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <AuraResultCard result={result} />
          </Animated.View>
          <TouchableOpacity style={styles.tryAgainBtn} onPress={handleReset} activeOpacity={0.8}>
            <Text style={styles.tryAgainText}>Check Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── LOADING VIEW ───
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingView}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.loadingImage} />}
          <Animated.Text style={[styles.loadingText, { opacity: pulseAnim }]}>
            {LOADING_MESSAGES[loadingMsgIndex]}
          </Animated.Text>
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: SPACING.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── MAIN VIEW ───
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero section */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{"🔮"}</Text>
          <Text style={styles.heroTitle}>Rate My Aura</Text>
          <Text style={styles.heroSub}>Upload a pic. Pick how you want to be judged. The AI does the rest.</Text>
        </View>

        {/* Step 1: Pick how to be rated */}
        <View style={styles.section}>
          <Text style={styles.stepLabel}>STEP 1</Text>
          <Text style={styles.sectionTitle}>Pick your lens</Text>
          <Text style={styles.sectionSub}>This changes what the AI focuses on</Text>

          <View style={styles.pathGrid}>
            {SIGMA_PATHS.map((path) => {
              const isSelected = path.id === selectedPath;
              return (
                <TouchableOpacity
                  key={path.id}
                  style={[styles.pathCard, isSelected && styles.pathCardSelected]}
                  onPress={() => handlePathSelect(path.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pathEmoji}>{path.emoji}</Text>
                  <Text style={[styles.pathName, isSelected && styles.pathNameSelected]}>
                    {path.label}
                  </Text>
                  <Text style={styles.pathHint} numberOfLines={2}>
                    {path.id === "auramaxxing" && "Overall vibe & energy"}
                    {path.id === "looksmaxxing" && "Style & glow-up"}
                    {path.id === "mogger_mode" && "Outshine everyone"}
                    {path.id === "rizzmaxxing" && "Charm & charisma"}
                    {path.id === "statusmaxxing" && "Flex & luxury"}
                    {path.id === "brainrot_mode" && "Chaos & memes"}
                    {path.id === "sigma_grindset" && "Grind & discipline"}
                  </Text>
                  {isSelected && <View style={styles.pathCheck}><Text style={styles.pathCheckText}>{"✓"}</Text></View>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Step 2: Upload */}
        <View style={styles.section}>
          <Text style={styles.stepLabel}>STEP 2</Text>
          <Text style={styles.sectionTitle}>Drop your pic</Text>
          <Text style={styles.sectionSub}>
            The AI will rate your {selectedPathData?.label.toLowerCase() || "aura"} energy
          </Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={pickImage} activeOpacity={0.8}>
            <Text style={styles.primaryBtnEmoji}>{"📸"}</Text>
            <Text style={styles.primaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnEmoji}>{"🤳"}</Text>
            <Text style={styles.secondaryBtnText}>Take a Selfie</Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{"💀"} {error}</Text>
            </View>
          )}
        </View>

        {/* How it works */}
        <View style={[styles.section, { marginBottom: SPACING.xxl * 2 }]}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.howItWorks}>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>1</Text>
              <Text style={styles.howText}>Pick a lens above</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>2</Text>
              <Text style={styles.howText}>Upload your best pic</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>3</Text>
              <Text style={styles.howText}>AI rates your aura 0-1000</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howNum}>4</Text>
              <Text style={styles.howText}>Get your roast + score</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingBottom: 40 },
  resultScroll: { padding: SPACING.lg, paddingBottom: 40 },

  // Hero
  hero: { alignItems: "center", paddingTop: SPACING.xl, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.lg },
  heroEmoji: { fontSize: 56, marginBottom: SPACING.sm },
  heroTitle: { fontSize: 32, fontWeight: "900", color: COLORS.textPrimary, marginBottom: SPACING.xs },
  heroSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22, maxWidth: 300 },

  // Sections
  section: { paddingHorizontal: SPACING.lg, marginTop: SPACING.lg },
  stepLabel: { fontSize: 11, fontWeight: "800", color: COLORS.primary, letterSpacing: 2, marginBottom: SPACING.xs },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: SPACING.xs },
  sectionSub: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.md },

  // Path grid
  pathGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  pathCard: {
    width: (SCREEN_WIDTH - SPACING.lg * 2 - SPACING.sm * 2) / 3,
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.sm + 2,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pathCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.bgElevated },
  pathEmoji: { fontSize: 28, marginBottom: SPACING.xs },
  pathName: { fontSize: 11, fontWeight: "700", color: COLORS.textSecondary, textAlign: "center", marginBottom: 2 },
  pathNameSelected: { color: COLORS.primary },
  pathHint: { fontSize: 9, color: COLORS.textMuted, textAlign: "center", lineHeight: 13 },
  pathCheck: {
    position: "absolute", top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  pathCheckText: { color: "#fff", fontSize: 11, fontWeight: "800" },

  // Buttons
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: SPACING.md + 2, gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  primaryBtnEmoji: { fontSize: 20 },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
  secondaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.bgCard, borderRadius: 16,
    paddingVertical: SPACING.md, gap: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  secondaryBtnEmoji: { fontSize: 20 },
  secondaryBtnText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "700" },

  // Error
  errorBox: { backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, padding: SPACING.md, marginTop: SPACING.sm },
  errorText: { color: COLORS.danger, fontSize: 14, textAlign: "center" },

  // How it works
  howItWorks: { flexDirection: "row", gap: SPACING.sm, marginTop: SPACING.xs },
  howStep: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: SPACING.sm, alignItems: "center" },
  howNum: { fontSize: 18, fontWeight: "900", color: COLORS.primary, marginBottom: 2 },
  howText: { fontSize: 10, color: COLORS.textMuted, textAlign: "center", lineHeight: 14 },

  // Loading
  loadingView: { flex: 1, justifyContent: "center", alignItems: "center", padding: SPACING.lg },
  loadingImage: { width: 150, height: 150, borderRadius: 75, marginBottom: SPACING.xl, borderWidth: 3, borderColor: COLORS.primary },
  loadingText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: "800", textAlign: "center" },

  // Try again
  tryAgainBtn: {
    alignSelf: "center", backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: 16, marginTop: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  tryAgainText: { color: COLORS.textSecondary, fontSize: 16, fontWeight: "700" },
});
