import { Redirect } from "expo-router";
import { View } from "react-native";

import Loader from "@/components/ui/Loader";
import { useSession } from "@/lib/auth";

export default function Index() {
  const { session, profile, loading } = useSession();

  // Wait for authentication/session initialization.
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#09090B",
        }}
      >
        <Loader />
      </View>
    );
  }

  // No authenticated session → login.
  if (!session) {
    return <Redirect href="/(auth)/Login" />;
  }

  // We have a session, but the profile hasn't loaded yet.
  // Don't assume the user needs onboarding.
  if (!profile) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#09090B",
        }}
      >
        <Loader />
      </View>
    );
  }

  // Authenticated user with an incomplete profile → onboarding.
  if (!profile.onboarding_complete) {
    return <Redirect href="/(onboarding)/Onboarding" />;
  }

  // Fully authenticated and onboarded → app.
  return <Redirect href="/(tabs)" />;
}
