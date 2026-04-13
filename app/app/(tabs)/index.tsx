import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { COLORS, SPACING } from "../../src/constants/theme";
import { SIGMA_PATHS } from "../../src/constants/paths";
import { getTierForScore } from "../../src/constants/tiers";
import { useAuthStore } from "../../src/store/authStore";
import PathSelector from "../../src/components/PathSelector";
import AuraResultCard from "../../src/components/AuraResultCard";

const API_URL = "http://localhost:3000";

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
  const fileInfo = await FileSystem.getInfoAsync(imageUri);
  if (!fileInfo.exists) throw new Error("Image file not found");

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
    throw new Error(`API error: ${response.status}`);
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

  // Cycle loading messages
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Pulse animation for loading
  useEffect(() => {
    if (!loading) {
      pulseAnim.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [loading]);

  // Slide-up animation for result
  useEffect(() => {
    if (result) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 9,
        useNativeDriver: true,
      }).start();
    }
  }, [result]);

  const pickImage = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      setError("Need camera roll access to check your aura fr");
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
    if (!permResult.granted) {
      setError("Need camera access to check your aura fr");
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
    const { setPath } = useAuthStore.getState();
    setPath(pathId);
  };

  const selectedPathData = SIGMA_PATHS.find((p) => p.id === selectedPath);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Vibe Check</Text>
        <Text style={styles.subtitle}>drop a pic, get rated no cap</Text>
      </View>

      {/* Path Selector */}
      <PathSelector selectedPath={selectedPath} onSelect={handlePathSelect} />

      {/* Selected path description */}
      {selectedPathData && (
        <Text style={styles.pathDescription}>
          {selectedPathData.emoji} {selectedPathData.description}
        </Text>
      )}

      {/* Main content area */}
      <View style={styles.content}>
        {/* Loading state */}
        {loading && (
          <View style={styles.loadingContainer}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
            )}
            <Animated.Text
              style={[styles.loadingText, { opacity: pulseAnim }]}
            >
              {LOADING_MESSAGES[loadingMsgIndex]}
            </Animated.Text>
            <ActivityIndicator
              size="large"
              color={COLORS.primary}
              style={{ marginTop: SPACING.md }}
            />
          </View>
        )}

        {/* Result card */}
        {result && !loading && (
          <Animated.View
            style={{ transform: [{ translateY: slideAnim }], width: "100%" }}
          >
            <AuraResultCard result={result} />

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Drop a Pic buttons (initial state) */}
        {!loading && !result && (
          <View style={styles.dropZone}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.selectedImage} />
            ) : (
              <View style={styles.placeholderIcon}>
                <Text style={styles.placeholderEmoji}>
                  {selectedPathData?.emoji || "✨"}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.dropButton}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Text style={styles.dropButtonText}>Drop a Pic</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.cameraButtonText}>Take a Selfie</Text>
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: SPACING.xs,
  },
  pathDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Loading
  loadingContainer: {
    alignItems: "center",
    padding: SPACING.lg,
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: SPACING.lg,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  // Drop zone
  dropZone: {
    alignItems: "center",
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  placeholderIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.bgElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: SPACING.md,
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  selectedImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  dropButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: 28,
    minWidth: 200,
    alignItems: "center",
  },
  dropButtonText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  cameraButton: {
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md - 2,
    borderRadius: 28,
    minWidth: 200,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cameraButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  // Reset
  resetButton: {
    alignSelf: "center",
    backgroundColor: COLORS.bgElevated,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md - 2,
    borderRadius: 24,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  resetButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "700",
  },
});
