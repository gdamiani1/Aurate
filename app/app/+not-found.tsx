import { Link, Stack } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SPACING, FONTS } from "../src/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops" }} />
      <View style={styles.container}>
        <Text style={styles.eyebrow}>⚠ 404</Text>
        <Text style={styles.title}>LOST IN{"\n"}THE SAUCE.</Text>
        <Text style={styles.body}>
          THIS SCREEN DOESN'T EXIST FR FR.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>← BACK HOME</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    backgroundColor: COLORS.bg,
  },
  eyebrow: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 3,
    marginBottom: SPACING.md,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 56,
    lineHeight: 64,
    paddingTop: 6,
    includeFontPadding: false,
    color: COLORS.textPrimary,
    letterSpacing: -2,
    textAlign: "center",
    marginBottom: SPACING.md,
  },
  body: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  linkText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 2,
  },
});
