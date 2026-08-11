import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { ProfileProvider } from "@/lib/ProfileContext";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
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
