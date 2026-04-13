import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../src/lib/supabase";
import { useAuthStore } from "../src/store/authStore";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

const ONBOARDING_KEY = "aurate_onboarding_complete";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const [authReady, setAuthReady] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  /* Listen for Supabase auth state changes */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        useAuthStore.setState({ user: session?.user ?? null });
        if (session?.user) {
          fetchProfile();
        }
        setAuthReady(true);
      }
    );

    // Also check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      useAuthStore.setState({ user: session?.user ?? null, loading: false });
      if (session?.user) {
        fetchProfile();
      }
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* Check onboarding status */
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === "true");
    });
  }, []);

  /* Route guard */
  useEffect(() => {
    if (!authReady || onboardingDone === null) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!user) {
      // Not signed in -> go to auth
      if (!inAuthGroup) {
        router.replace("/auth/signup");
      }
    } else if (!onboardingDone) {
      // Signed in but hasn't completed onboarding
      if (!inOnboarding) {
        router.replace("/onboarding");
      }
    } else {
      // Signed in + onboarded -> main tabs
      if (inAuthGroup || inOnboarding) {
        router.replace("/(tabs)");
      }
    }
  }, [user, authReady, onboardingDone, segments]);

  // Re-check onboarding flag when user changes (e.g., after sign-up navigates to onboarding)
  useEffect(() => {
    if (user) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
        setOnboardingDone(val === "true");
      });
    }
  }, [user]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
