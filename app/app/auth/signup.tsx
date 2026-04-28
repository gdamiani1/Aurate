import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS, SPACING, FONTS } from "../../src/constants/theme";
const BRAINROT_ERRORS: Record<string, string> = {
  "User already registered": "Bro, that email's already taken. You're not that NPC.",
  "Password should be at least 6 characters": "Password too weak fam. Minimum 6 chars or you're cooked.",
  "Invalid email": "That email is giving Ohio energy. Try again.",
  default: "Something went wrong. That's not very sigma of us.",
};

function getBrainrotError(message: string): string {
  if (message.includes("profiles_age_16_check") || message.includes("AGE_RESTRICTED")) {
    return "Mogster is for ages 16 and up. come back when you're cooking.";
  }
  return BRAINROT_ERRORS[message] || BRAINROT_ERRORS.default;
}

function computeAgeYears(dob: Date): number {
  return (Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
}

function formatIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((s) => s.signUp);

  const handleSignUp = async () => {
    if (!email || !password || !username) {
      setError("Fill in all the fields or you're literally an NPC.");
      return;
    }
    if (!dob) {
      setError("Pick your date of birth fam.");
      return;
    }
    if (computeAgeYears(dob) < 16) {
      setError("Mogster is for ages 16 and up. come back when you're cooking.");
      return;
    }
    if (!ageConfirmed) {
      setError("Confirm you're 16+ to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, username, formatIsoDate(dob));
    } catch (err: any) {
      setError(getBrainrotError(err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrowLine} />
          <Text style={styles.eyebrow}>── 01 / VERIFY</Text>
        </View>
        <Text style={styles.header}>HOW OLD{"\n"}ARE YOU{"\n"}<Text style={{ color: COLORS.hazard }}>FR.</Text></Text>
        <Text style={styles.sub}>
          we don&apos;t serve minors. drop your real DOB.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="sigma@mogster.app"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username (unique)</Text>
          <TextInput
            style={styles.input}
            placeholder="xX_SigmaBoy_Xx"
            placeholderTextColor={COLORS.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="min 6 chars no cap"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>DATE OF BIRTH</Text>
          <TouchableOpacity
            style={styles.dobButton}
            onPress={() => setShowPicker(true)}
            activeOpacity={0.85}
          >
            <Text style={[styles.dobText, !dob && styles.dobPlaceholder]}>
              {dob ? formatIsoDate(dob) : "TAP TO PICK"}
            </Text>
            <Text style={styles.dobChevron}>▼</Text>
          </TouchableOpacity>
          {dob && computeAgeYears(dob) >= 16 && (
            <Text style={styles.ageConfirmText}>
              ✓ {Math.floor(computeAgeYears(dob))} YEARS · IN THE KITCHEN
            </Text>
          )}
        </View>

        {showPicker && (
          <DateTimePicker
            value={dob ?? new Date(2008, 0, 1)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(_, d) => {
              setShowPicker(Platform.OS === "ios");
              if (d) setDob(d);
            }}
            themeVariant="dark"
          />
        )}

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgeConfirmed(!ageConfirmed)}
          activeOpacity={0.7}
        >
          <View
            style={[styles.checkbox, ageConfirmed && styles.checkboxChecked]}
          >
            {ageConfirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I'm 16+ and agree to the{" "}
            <Text
              style={styles.link}
              onPress={() => router.push("https://mogster.app/terms" as never)}
            >
              Terms
            </Text>
            .
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.ink} />
          ) : (
            <View style={styles.buttonRow}>
              <Text style={styles.buttonText}>CONTINUE</Text>
              <Text style={styles.buttonText}>→</Text>
            </View>
          )}
        </TouchableOpacity>

        <Link href="/auth/signin" asChild>
          <TouchableOpacity style={styles.linkWrap}>
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkAccent}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },

  // Editorial header
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  eyebrowLine: {
    width: 20,
    height: 1,
    backgroundColor: COLORS.hazard,
  },
  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.hazard,
    letterSpacing: 2.8,
  },
  header: {
    fontFamily: FONTS.display,
    fontSize: 56,
    lineHeight: 50,
    color: COLORS.paper,
    letterSpacing: -2,
    marginBottom: SPACING.md,
    textTransform: "uppercase",
  },
  sub: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.paperMute,
    letterSpacing: 0.4,
    marginBottom: SPACING.xl,
    lineHeight: 18,
  },

  // Error
  errorBox: {
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    borderWidth: 1,
    borderColor: COLORS.blood,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.blood,
    fontSize: 12,
    fontFamily: FONTS.monoBold,
    textAlign: "center",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Form fields
  field: { marginBottom: SPACING.md },
  label: {
    color: COLORS.paperMute,
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: SPACING.xs,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.ink2,
    padding: SPACING.md,
    fontSize: 16,
    color: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontFamily: FONTS.mono,
  },

  // DOB
  dobButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.ink2,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.hazard,
  },
  dobText: {
    fontSize: 16,
    color: COLORS.hazard,
    fontFamily: FONTS.mono,
    letterSpacing: 1,
  },
  dobPlaceholder: {
    color: COLORS.ghost,
    letterSpacing: 2,
    fontSize: 13,
    fontFamily: FONTS.monoBold,
  },
  dobChevron: {
    fontFamily: FONTS.mono,
    color: COLORS.ghost,
    fontSize: 12,
  },
  ageConfirmText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.mint,
    letterSpacing: 1.5,
    marginTop: 8,
  },

  // Checkbox
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.ink2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.hazard,
    borderColor: COLORS.hazard,
  },
  checkmark: {
    color: COLORS.ink,
    fontFamily: FONTS.display,
    fontSize: 14,
  },
  checkboxLabel: {
    flex: 1,
    color: COLORS.paperMute,
    fontSize: 13,
    fontFamily: FONTS.mono,
    lineHeight: 18,
  },
  link: { color: COLORS.hazard, textDecorationLine: "underline" },

  // CTA
  button: {
    backgroundColor: COLORS.hazard,
    paddingVertical: 18,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: FONTS.display,
    color: COLORS.ink,
    fontSize: 22,
    letterSpacing: -0.5,
  },

  linkWrap: { marginTop: SPACING.lg, alignItems: "center" },
  linkText: {
    color: COLORS.paperMute,
    fontSize: 13,
    fontFamily: FONTS.mono,
    letterSpacing: 0.5,
  },
  linkAccent: {
    color: COLORS.hazard,
    fontFamily: FONTS.monoBold,
  },
});
