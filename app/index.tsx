import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

import Loader from "@/components/ui/Loader";
import { useSession } from "@/lib/auth";
import { getProfile } from "@/lib/db";

export default function Index() {
  const { session, loading } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<{
    onboarding_complete: boolean;
  } | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [profileTimedOut, setProfileTimedOut] = useState(false);

  const TIMEOUT_MS = 8000;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (!session) {
          setProfile(null);
          return;
        }

        setProfileTimedOut(false);
        const profilePromise = getProfile();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("profile_timeout")), TIMEOUT_MS),
        );

        const profile = await Promise.race([profilePromise, timeoutPromise]);
        setProfile(profile as any);
      } catch (error) {
        console.error("Failed to load profile:", error);
        if ((error as Error).message === "profile_timeout") {
          setProfileTimedOut(true);
        }
        setProfile(null);
      }
    };

    loadProfile();
  }, [session]);

  useEffect(() => {
    if (!loading) {
      setLoadingTimedOut(false);
      return;
    }

    const t = setTimeout(() => setLoadingTimedOut(true), TIMEOUT_MS);
    return () => clearTimeout(t as any);
  }, [loading]);

  if (loading) {
    if (!loadingTimedOut) {
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

    // Loading has taken too long — show a retry / navigation option.
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#09090B",
          padding: 20,
        }}
      >
        <Text style={{ color: "#fff", marginBottom: 12 }}>
          Still loading authentication. This may be a network issue.
        </Text>
        <View style={{ width: 200, marginBottom: 8 }}>
          <Button
            title="Retry"
            onPress={() => router.replace("/")}
            color="#1F2937"
          />
        </View>
        <View style={{ width: 200 }}>
          <Button
            title="Go to Login"
            onPress={() => router.replace("/(auth)/Login")}
            color="#374151"
          />
        </View>
      </View>
    );
  }

  if (profileTimedOut) {
    // If profile fetch timed out, allow user to retry fetching profile or go to login.
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#09090B",
          padding: 20,
        }}
      >
        <Text style={{ color: "#fff", marginBottom: 12 }}>
          Still loading your profile. Try again or go to the login screen.
        </Text>
        <View style={{ width: 200, marginBottom: 8 }}>
          <Button
            title="Retry Profile"
            onPress={() => router.replace("/")}
            color="#1F2937"
          />
        </View>
        <View style={{ width: 200 }}>
          <Button
            title="Go to Login"
            onPress={() => router.replace("/(auth)/Login")}
            color="#374151"
          />
        </View>
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
