import DailyCheckin from "@/components/tiles/DailyCheckIn";
import GoalsTile from "@/components/tiles/GoalsTile";
import StreaksTile from "@/components/tiles/StreaksTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import Header from "@/components/ui/Header";
import { getCurrentUser } from "@/lib/auth";
import { Redirect } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  if (getCurrentUser != null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <StreaksTile />
          <GoalsTile />
          <TodaysPlan />
          <DailyCheckin />
        </View>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
