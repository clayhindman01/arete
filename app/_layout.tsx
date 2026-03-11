import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/lib/auth";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { session, loading, profile } = useSession();
  const colorScheme = useColorScheme();

  if (loading) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {!session && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
        </Stack>
      )}

      {!profile?.onboarding_complete && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
        </Stack>
      )}

      {profile?.onboarding_complete && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      )}
    </ThemeProvider>
  );
}
