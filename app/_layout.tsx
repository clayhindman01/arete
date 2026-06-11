import { Stack } from "expo-router";
import "react-native-reanimated";

import { ProfileProvider } from "@/app/(auth)/ProfileContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useEffect, useState } from "react";

// export const unstable_settings = {
//   anchor: "(tabs)",
// };

export default function RootLayout() {
  const { session, loading } = useSession();
  const [profile, setProfile] = useState<{ onboarding_complete: boolean }>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        setProfile(profile);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    loadProfile();
  }, []);

  const colorScheme = useColorScheme();

  // useEffect(() => {
  //   if (loading) return;

  //   if (!session && !isLoading) {
  //     router.replace("/(auth)/Login");
  //     return;
  //   }

  //   if (session && !isLoading && profile && !profile.onboarding_complete) {
  //     router.replace("/(onboarding)/Onboarding");
  //     return;
  //   }

  //   if (session && !isLoading && profile?.onboarding_complete) {
  //     router.replace("/(tabs)");
  //   }
  // }, [session, profile, loading]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <ProfileProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ProfileProvider>
    </ThemeProvider>
  );
}
