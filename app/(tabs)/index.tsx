import DailyCheckin from "@/components/tiles/DailyCheckIn";
import GoalsTile from "@/components/tiles/GoalsTile";
import StreaksTile from "@/components/tiles/StreaksTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import Header from "@/components/ui/Header";
import { getCurrentUser } from "@/lib/auth";
import { getActivePlan } from "@/lib/db";
import { PlanGeneration } from "@/types/PlanGeneration";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [activePlan, setActivePlan] = useState<{
    plan_json: PlanGeneration;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get users active plans using getACtivePlan and log the result
    const fetchActivePlan = async () => {
      try {
        const activePlan = await getActivePlan();
        setActivePlan(activePlan);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching active plan:", error);
      }
    };

    fetchActivePlan();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
        {/* <Header /> */}
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (getCurrentUser != null && activePlan) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <StreaksTile plan_json={activePlan?.plan_json} />
          <GoalsTile goal={activePlan?.plan_json?.goal} />
          <TodaysPlan plan_json={activePlan?.plan_json} />
          <DailyCheckin />
        </View>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
