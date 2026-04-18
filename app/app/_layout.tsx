import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Anton_400Regular } from "@expo-google-fonts/anton";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import { Bungee_400Regular } from "@expo-google-fonts/bungee";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { supabase } from "../src/lib/supabase";
import { useAuthStore } from "../src/store/authStore";
import RootErrorBoundary from "../src/components/RootErrorBoundary";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync().catch(() => {
  // Fails silently if splash is already hidden or native module unavailable
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    Anton_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    Bungee_400Regular,
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) {
      // Don't crash on font load errors — just log and continue with system fonts
      console.warn("Font load error:", error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <RootErrorBoundary>
      <RootLayoutNav />
    </RootErrorBoundary>
  );
}

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const user = useAuthStore((s) => s.user);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const checkOnboarding = useAuthStore((s) => s.checkOnboarding);

  const [authReady, setAuthReady] = useState(false);

  /* Listen for Supabase auth state changes */
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          try {
            useAuthStore.setState({ user: session?.user ?? null });
            if (session?.user) {
              fetchProfile().catch((e) => console.warn("fetchProfile failed:", e));
            }
            setAuthReady(true);
          } catch (e) {
            console.warn("Auth state change handler failed:", e);
            setAuthReady(true);
          }
        }
      );
      unsub = () => subscription.unsubscribe();

      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          useAuthStore.setState({ user: session?.user ?? null, loading: false });
          if (session?.user) {
            fetchProfile().catch((e) => console.warn("fetchProfile failed:", e));
          }
          setAuthReady(true);
        })
        .catch((e) => {
          console.warn("getSession failed:", e);
          useAuthStore.setState({ user: null, loading: false });
          setAuthReady(true);
        });
    } catch (e) {
      console.warn("Auth init failed:", e);
      setAuthReady(true);
    }

    return () => {
      if (unsub) unsub();
    };
  }, []);

  /* Check onboarding status */
  useEffect(() => {
    checkOnboarding().catch((e) => console.warn("checkOnboarding failed:", e));
  }, [user]);

  /* Route guard */
  useEffect(() => {
    if (!authReady || onboardingComplete === null) return;

    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    try {
      if (!user) {
        if (!inAuthGroup) {
          router.replace("/auth/signup");
        }
      } else if (!onboardingComplete) {
        if (!inOnboarding) {
          router.replace("/onboarding");
        }
      } else {
        if (inAuthGroup || inOnboarding) {
          router.replace("/(tabs)");
        }
      }
    } catch (e) {
      console.warn("Route guard navigation failed:", e);
    }
  }, [user, authReady, onboardingComplete, segments]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="aura/[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="battles/challenge/[friendId]" />
        <Stack.Screen name="battles/accept/[battleId]" />
        <Stack.Screen name="battles/reveal/[battleId]" options={{ gestureEnabled: false }} />
      </Stack>
    </ThemeProvider>
  );
}
