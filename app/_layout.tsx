import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import "react-native-reanimated";
import { useEffect } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ProfileProvider } from "@/lib/ProfileContext";
import { trackEvent } from "@/lib/analytics";
import {
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void trackEvent("app_opened");
  }, []);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DarkTheme}>
      <ProfileProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </ProfileProvider>
    </ThemeProvider>
  );
}
