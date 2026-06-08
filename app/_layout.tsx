import { router, Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/lib/auth";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { session, loading, profile } = useSession();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace("/(auth)/Login");
      return;
    }

    if (session && profile && !profile.onboarding_complete) {
      router.replace("/(onboarding)/Onboarding");
      return;
    }

    if (session && profile?.onboarding_complete) {
      router.replace("/(tabs)");
    }
  }, [session, profile, loading]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
