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
  hasCompletedDailyCheckInToday,
} from "@/lib/db";
import { Tasks } from "@/types/PlanGeneration";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const [todaysTasks, setTodaysTasks] = useState<Tasks[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyCheckInComplete, setDailyCheckInComplete] = useState<boolean>(false);
  const [weeklyReportComplete, setWeeklyReportComplete] = useState<boolean>(false);
  const [ isWeeklyReportAvailable, setIsWeeklyReportAvailable ] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>("");

  const [latentPlan, setLatentPlan] = useState<any | null>(null);
  
  const fetchActivePlan = async () => {
    try {
      const plan = await getActivePlan();
      await createOrUpdateLatentPlan(plan.plan_json).then(async (latentPlan) => {
        setLatentPlan(latentPlan);
        console.log("Latent Plan:", latentPlan.weekly_task_pool);
        const todaysTasks = await getOrCreatePreCheckinDailyPlan(
          latentPlan.weekly_task_pool,
        );
        console.log("Today's Tasks:", todaysTasks);
        setTodaysTasks(todaysTasks.tasks ?? []);
        setAiSummary(todaysTasks.aiSummary ?? "");
      setIsLoading(false);
      });
      
      
    } catch (error) {
      console.error("Error fetching active plan:", error);
    }
  };

  useEffect(() => {
    hasCompletedDailyCheckInToday().then((completed) => {
      setDailyCheckInComplete(completed);
    });

    fetchActivePlan();
  }, []);

  useFocusEffect(
    useCallback(() => {
      console.log("Dashboard screen focused, refreshing data...");
      fetchActivePlan();
    }, [])
  );

  const completedTasks = useMemo(
  () => todaysTasks.filter(task => task.completed).length,
  [todaysTasks]
);
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

  if (getCurrentUser != null && todaysTasks) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
        <Header />
        <View style={{ padding: 5, paddingVertical: 10 }}>
          <DailyProgress
            completed={completedTasks}
            total={todaysTasks.length}
          />
          {dailyCheckInComplete && (completedTasks === todaysTasks.length) && (
            <EverythingCompletedTile />
          )}
          {isWeeklyReportAvailable && !weeklyReportComplete && (
            <WeeklyReportTile
              weeklyReportComplete={weeklyReportComplete}
              setWeeklyReportComplete={setWeeklyReportComplete}
            />
          )}
          {!dailyCheckInComplete && (
            <DailyCheckInTile
              dailyCheckInComplete={dailyCheckInComplete}
              setDailyCheckInComplete={setDailyCheckInComplete}
              todaysTasks={latentPlan}
            />
          )}
          <TodaysPlan
            aiSummary = {aiSummary}
            dailyCheckInComplete={dailyCheckInComplete}
            todaysTasks={todaysTasks}
            setTodaysTasks={setTodaysTasks}
          />
          <HabitsStreaksLayout />
          {dailyCheckInComplete && (
            <DailyCheckInTile
              dailyCheckInComplete={dailyCheckInComplete}
              setDailyCheckInComplete={setDailyCheckInComplete}
              todaysTasks={todaysTasks}
            />
          )}
          {isWeeklyReportAvailable && weeklyReportComplete && (
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
