import DailyProgress from "@/components/DailyProgress";
import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import DailyCheckin from "@/components/tiles/DailyCheckIn";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import WeeklyReportTile from "@/components/tiles/WeeklyReportTile";
import Header from "@/components/ui/Header";
import { getCurrentUser } from "@/lib/auth";
import { getActivePlan, getTodaysSessions } from "@/lib/db";
import { PlanGeneration } from "@/types/PlanGeneration";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [activePlan, setActivePlan] = useState<{
    plan_json: PlanGeneration;
  } | null>(null);
  const [todaysSessions, setTodaysSessions] = useState<{
    todaysRoutines: any[];
    todaysTasks: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyCheckInComplete, setDailyCheckInComplete] = useState(false);
  const [weeklyReportComplete, setWeeklyReportComplete] = useState(false);

  useEffect(() => {
    // Get users active plans using getACtivePlan and log the result
    const fetchActivePlan = async () => {
      try {
        const [plan, todaysSessions] = await Promise.all([
          getActivePlan(),
          getTodaysSessions(),
        ]);
        setActivePlan(plan);
        setTodaysSessions(todaysSessions);
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
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <DailyProgress completed={0} total={2} />
          {!weeklyReportComplete && (
            <WeeklyReportTile
              weeklyReportComplete={weeklyReportComplete}
              setWeeklyReportComplete={setWeeklyReportComplete}
            />
          )}
          {!dailyCheckInComplete && (
            <DailyCheckin
              dailyCheckInComplete={dailyCheckInComplete}
              setDailyCheckInComplete={setDailyCheckInComplete}
            />
          )}
          <TodaysPlan tasks={todaysSessions?.todaysTasks} />
          <HabitsStreaksLayout />
          {dailyCheckInComplete && (
            <DailyCheckin
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
