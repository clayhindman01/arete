import DailyProgress from "@/components/DailyProgress";
import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import DailyCheckInTile from "@/components/tiles/DailyCheckInTile";
import EverythingCompletedTile from "@/components/tiles/EverythingCompletedTile";
import InsightsTile from "@/components/tiles/InsightsTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import WeeklyReportTile from "@/components/tiles/WeeklyReportTile";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";
import Loader from "@/components/ui/Loader";
import PulseText from "@/components/ui/PulseText";
import SlideUpMenu from "@/components/ui/SlideUpMenu";
import { getCurrentUser } from "@/lib/auth";
import {
  createOrUpdateLatentPlan,
  getActivePlan,
  getOrCreatePreCheckinDailyPlan,
  hasCompletedDailyCheckInToday,
} from "@/lib/db";
import { Tasks } from "@/types/PlanGeneration";
import { Redirect, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Settings from "./Settings";

export default function Dashboard() {
  const [todaysTasks, setTodaysTasks] = useState<Tasks[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyCheckInComplete, setDailyCheckInComplete] =
    useState<boolean>(false);
  const [weeklyReportComplete, setWeeklyReportComplete] =
    useState<boolean>(false);
  const [isWeeklyReportAvailable, setIsWeeklyReportAvailable] =
    useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const { shouldShowIntro } = useLocalSearchParams<{
    shouldShowIntro: string;
  }>();
  const [showIntro, setShowIntro] = useState<string>(
    shouldShowIntro === undefined ? "true" : shouldShowIntro,
  );

  const [latentPlan, setLatentPlan] = useState<any | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [calendarStatusOverrides, setCalendarStatusOverrides] = useState<
    Record<string, string>
  >({});
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const deriveCalendarStatus = (tasks: Tasks[] | null | undefined) => {
    if (!tasks || tasks.length === 0) {
      return "none";
    }

    const completedCount = tasks.filter((task) => task.completed).length;

    if (completedCount === 0) {
      return "none";
    }

    if (completedCount === tasks.length) {
      return "complete";
    }

    return "partial";
  };

  const handleSettingsClick = () => {
    setIsMenuOpen(true);
  };

  const fetchActivePlan = async () => {
    try {
      const plan = await getActivePlan();
      setGoal(plan?.goal ?? null);
      await createOrUpdateLatentPlan(plan.plan_json).then(
        async (latentPlan) => {
          setLatentPlan(latentPlan);
          const todaysPlan = await getOrCreatePreCheckinDailyPlan(
            latentPlan?.weekly_task_pool ?? [],
          );
          const normalizedTasks: Tasks[] = (todaysPlan?.tasks ?? []).map(
            (task: any) => ({
              id: task.id,
              title: task.title ?? "",
              description: task.description ?? "",
              estimated_minutes: task.estimated_minutes ?? 0,
              one_word_description: task.one_word_description ?? "",
              completed: Boolean(task.completed),
            }),
          );
          console.log("Normalized tasks", normalizedTasks);

          setTodaysTasks(normalizedTasks);
          setAiSummary(todaysPlan?.aiSummary ?? "");
        },
      );
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
      fetchActivePlan().then(() => setIsLoading(false));
    }, []),
  );

  const completedTasks = useMemo(
    () => todaysTasks.filter((task) => task.completed).length,
    [todaysTasks],
  );
  if (isLoading && showIntro === "true") {
    return <PulseText route="home" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <Loader />
      </View>
    );
  }

  if (getCurrentUser != null && todaysTasks) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
        <Header handleSettingsClick={handleSettingsClick} />
        <DailyProgress completed={completedTasks} total={todaysTasks.length} />
        <ScrollView style={{ marginBottom: -35 }}>
          <View style={{ padding: 5, paddingVertical: 10, marginBottom: 15 }}>
            {dailyCheckInComplete && completedTasks === todaysTasks.length && (
              <EverythingCompletedTile />
            )}
            <Card>
              <Text
                style={{
                  color: "#A1A1AA",
                  fontSize: 16,
                  fontWeight: 500,
                  textAlign: "center",
                  paddingBottom: 5,
                  letterSpacing: 2,
                }}
              >
                Goal: {goal}.
              </Text>
            </Card>
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
            {aiSummary && dailyCheckInComplete && (
              <InsightsTile aiSummary={aiSummary} />
            )}
            <HabitsStreaksLayout
              refreshKey={calendarRefreshKey}
              statusOverrides={calendarStatusOverrides}
            />

            <TodaysPlan
              aiSummary={aiSummary}
              dailyCheckInComplete={dailyCheckInComplete}
              todaysTasks={todaysTasks}
              setTodaysTasks={setTodaysTasks}
              onTaskToggle={(task, nextValue) => {
                setTodaysTasks((previousTasks) => {
                  const nextTasks = previousTasks.map((currentTask) =>
                    currentTask.id === task.id
                      ? { ...currentTask, completed: nextValue }
                      : currentTask,
                  );

                  const todayKey = new Date().toISOString().split("T")[0];
                  setCalendarStatusOverrides((previousOverrides) => ({
                    ...previousOverrides,
                    [todayKey]: deriveCalendarStatus(nextTasks),
                  }));

                  return nextTasks;
                });

                setCalendarRefreshKey((value) => value + 1);
              }}
            />

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
            <SlideUpMenu
              visible={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              height="40%"
            >
              <Settings />
            </SlideUpMenu>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
