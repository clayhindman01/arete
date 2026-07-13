import DailyProgress from "@/components/DailyProgress";
import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import DailyCheckInTile from "@/components/tiles/DailyCheckInTile";
import EverythingCompletedTile from "@/components/tiles/EverythingCompletedTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import WeeklyReportTile from "@/components/tiles/WeeklyReportTile";
import Header from "@/components/ui/Header";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrUpdateLatentPlan,
  getActivePlan,
  getOrCreatePreCheckinDailyPlan,
} from "@/lib/db";
import { PlanGeneration } from "@/types/PlanGeneration";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [activePlan, setActivePlan] = useState<{
    plan_json: PlanGeneration;
  } | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyCheckInComplete, setDailyCheckInComplete] = useState(false);
  const [weeklyReportComplete, setWeeklyReportComplete] = useState(false);

  useEffect(() => {
    const fetchActivePlan = async () => {
      try {
        const [plan] = await Promise.all([getActivePlan()]);
        const latentPlan = await createOrUpdateLatentPlan(plan.plan_json);
        const todaysTasks = await getOrCreatePreCheckinDailyPlan(
          latentPlan.weekly_task_pool,
        );
        setTodaysSessions(todaysTasks);
        setActivePlan(plan);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching active plan:", error);
      }
    };

    fetchActivePlan();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
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

  if (getCurrentUser != null && todaysSessions) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <DailyProgress
            completed={0}
            total={todaysSessions.length}
            // total={2}
          />
          {dailyCheckInComplete && weeklyReportComplete && (
            <EverythingCompletedTile />
          )}
          {!weeklyReportComplete && (
            <WeeklyReportTile
              weeklyReportComplete={weeklyReportComplete}
              setWeeklyReportComplete={setWeeklyReportComplete}
            />
          )}
          {!dailyCheckInComplete && (
            <DailyCheckInTile
              dailyCheckInComplete={dailyCheckInComplete}
              setDailyCheckInComplete={setDailyCheckInComplete}
            />
          )}
          <TodaysPlan
            dailyCheckInComplete={dailyCheckInComplete}
            tasks={todaysSessions}
          />
          <HabitsStreaksLayout />
          {dailyCheckInComplete && (
            <DailyCheckInTile
              dailyCheckInComplete={dailyCheckInComplete}
              setDailyCheckInComplete={setDailyCheckInComplete}
            />
          )}
          {weeklyReportComplete && (
            <WeeklyReportTile
              weeklyReportComplete={weeklyReportComplete}
              setWeeklyReportComplete={setWeeklyReportComplete}
            />
          )}
        </View>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
