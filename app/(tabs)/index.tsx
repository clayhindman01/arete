import DailyCheckin from "@/components/tiles/DailyCheckIn";
import StreaksTile from "@/components/tiles/StreaksTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import Header from "@/components/ui/Header";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/db";
import { useTheme } from "@react-navigation/native";
import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const { colors } = useTheme();
  const router = useRouter();

  const [showCoachInsight, setShowCoachInsight] = useState(true);
  const loadProfile = async () => {
    try {
      const profile = await getProfile();
      console.log("Profile", profile);
    } catch (error) {
      console.error(error);
    }
  };

  loadProfile();

  if (getCurrentUser != null) {
    return (
      <SafeAreaView>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <StreaksTile />
          <TodaysPlan />
          <DailyCheckin />
        </View>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
