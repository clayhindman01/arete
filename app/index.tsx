import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { useSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default function Index() {
  const { session, loading } = useSession();

  const [profile, setProfile] = useState<{
    onboarding_complete: boolean;
  } | null>(null);

  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!session) {
          setProfile(null);
          return;
        }

        const profile = await getProfile();
        setProfile(profile);
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [session]);

  if (loading || profileLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#09090B",
        }}
      >
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/Login" />;
  }

  if (!profile?.onboarding_complete) {
    return <Redirect href="/(onboarding)/Onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
