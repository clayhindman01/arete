import DailyProgress from "@/components/DailyProgress";
import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import DailyCheckInTile from "@/components/tiles/DailyCheckInTile";
import EverythingCompletedTile from "@/components/tiles/EverythingCompletedTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import Card from "@/components/ui/Card";
import DailyCheckinRecap from "@/components/ui/DailyCheckinRecap";
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
import { registerForNotifications } from "@/lib/notifications";
import {
  cancelCompletionReminder,
  scheduleDailyNotifications,
} from "@/lib/scheduleNotifications";
import { getCurrentDateWithTimezoneOffset } from "@/lib/utils";
import { Tasks } from "@/types/PlanGeneration";
import * as Notifications from "expo-notifications";
import { Redirect, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Settings from "./Settings";

type MenuOption = "settings" | "checkin" | "date";

export default function Dashboard() {
  const [todaysTasks, setTodaysTasks] = useState<Tasks[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dailyCheckInComplete, setDailyCheckInComplete] =
    useState<boolean>(false);

  const [aiSummary, setAiSummary] = useState<string>("");
  const { shouldShowIntro, dailyCheckInCompleted } = useLocalSearchParams<{
    shouldShowIntro: string;
    dailyCheckInCompleted?: string;
  }>();
  const [completedTasks, setCompletedTasks] = useState<number>(0);
  const [latentPlan, setLatentPlan] = useState<any | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);
  const [calendarStatusOverrides, setCalendarStatusOverrides] = useState<
    Record<string, string>
  >({});
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuOption>();

  const showIntro = shouldShowIntro === undefined ? "true" : shouldShowIntro;

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

  const handleSelectedMenuPress = (value: MenuOption) => {
    setSelectedMenu(value);
  };

  const handleMenuClick = (label: MenuOption) => {
    setIsMenuOpen(true);
    handleSelectedMenuPress(label);
  };

  const testNoifications = async () => {
    registerForNotifications();
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Test Notification",
        body: "This is a test notification.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // Trigger after 5 seconds
      },
    });
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

          setTodaysTasks(normalizedTasks);
          setAiSummary(todaysPlan?.aiSummary ?? "");
        },
      );
    } catch (error) {
      console.error("Error fetching active plan:", error);
    }
  };

  const setNotification = async () => {
    const enabled = await registerForNotifications();

    if (enabled) {
      await scheduleDailyNotifications();
    }
  };

  useEffect(() => {
    setNotification();
  }, []);

  useEffect(() => {
    if (dailyCheckInCompleted === "true") {
      setDailyCheckInComplete(true);
    }
  }, [dailyCheckInCompleted]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      hasCompletedDailyCheckInToday().then((completed) => {
        setDailyCheckInComplete(completed);
      });
      fetchActivePlan().then(() => setIsLoading(false));
    }, []),
  );

  useEffect(() => {
    setCompletedTasks(todaysTasks.filter((task) => task.completed).length);
    if (todaysTasks.length === completedTasks && todaysTasks.length > 0) {
      cancelCompletionReminder();
    }
  }, [todaysTasks]);

  // const completedTasks = useMemo(
  //   () => todaysTasks.filter((task) => task.completed).length,
  //   [todaysTasks],
  // );

  console.log("todaysTasks", todaysTasks, "completedTasks", completedTasks);

  const renderMenuComponent = () => {
    switch (selectedMenu) {
      case "settings":
        return <Settings />;
      case "checkin":
        return <DailyCheckinRecap aiSummary={aiSummary} />;
    }
  };

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
        <Header handleSettingsClick={() => handleMenuClick("settings")} />
        <DailyProgress completed={completedTasks} total={todaysTasks.length} />
        <ScrollView style={{ marginBottom: -35 }}>
          <View style={{ padding: 5, paddingVertical: 5, marginBottom: 20 }}>
            {dailyCheckInComplete && completedTasks === todaysTasks.length && (
              <EverythingCompletedTile />
            )}
            <Card>
              <Text
                style={{
                  color: "#A1A1AA",
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 20,
                  letterSpacing: 2,
                  textAlign: "center",
                  textTransform: "uppercase",
                }}
              >
                {goal}
              </Text>
            </Card>
            {!dailyCheckInComplete && (
              <DailyCheckInTile
                dailyCheckInComplete={dailyCheckInComplete}
                setDailyCheckInComplete={setDailyCheckInComplete}
                todaysTasks={latentPlan}
                handleDailyCheckinMenuPress={() => handleMenuClick("checkin")}
              />
            )}
            {/* {aiSummary && dailyCheckInComplete && (
              <InsightsTile
                title="WHY YOUR PLAN CHANGED"
                aiSummary={aiSummary}
              />
            )} */}
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

                  const todayKey = getCurrentDateWithTimezoneOffset();
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
                handleDailyCheckinMenuPress={() => handleMenuClick("checkin")}
              />
            )}
            <SlideUpMenu
              visible={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              height="70%"
            >
              {renderMenuComponent()}
            </SlideUpMenu>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
