import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import { ThemedText } from "@/components/themed-text";
import DailyCheckInTile from "@/components/tiles/DailyCheckInTile";
import EverythingCompletedTile from "@/components/tiles/EverythingCompletedTile";
import GoalCard from "@/components/tiles/GoalCard";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import WeeklyReportTile from "@/components/tiles/WeeklyReportTile";
import WelcomeTile from "@/components/tiles/WelcomeTile";
import Button from "@/components/ui/Button";
import DailyCheckinRecap from "@/components/ui/DailyCheckinRecap";
import DatePlanRecap from "@/components/ui/DatePlanRecap";
import Header from "@/components/ui/Header";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";
import PulseText from "@/components/ui/PulseText";
import SlideUpMenu from "@/components/ui/SlideUpMenu";
import { trackEvent } from "@/lib/analytics";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Settings from "./Settings";

// Session-scoped flags to ensure modals only appear once per app session
let hasShownCheckinModalThisSession = false;
let hasShownWelcomeModalThisSession = false;
let hasShownWeeklyReportModalThisSession = false;

type MenuOption = "settings" | "checkin" | "date";

function getPreviousSundaySaturdayWindow(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());

  const weekStart = new Date(currentSunday);
  weekStart.setDate(currentSunday.getDate() - 7);

  const weekEnd = new Date(currentSunday);
  weekEnd.setDate(currentSunday.getDate() - 1);

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
  };
}

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showWeeklyReportModal, setShowWeeklyReportModal] = useState(false);
  const [weeklyReportComplete, setWeeklyReportComplete] = useState(false);
  const [weeklyReportAvailable, setWeeklyReportAvailable] = useState(false);
  const [weeklyReportStorageKey, setWeeklyReportStorageKey] = useState<
    string | null
  >(null);
  const [isFirstDayFlag, setIsFirstDayFlag] = useState(false);
  const dailyPlanCompletionTrackedForDay = useRef<string | null>(null);
  const router = useRouter();

  const showIntro = shouldShowIntro === undefined ? "true" : shouldShowIntro;

  const buildWeeklyRecapViewedKey = (
    userId: string,
    weekStart: string,
    weekEnd: string,
  ) => `weekly_recap_viewed:${userId}:${weekStart}:${weekEnd}`;

  const markWeeklyRecapViewed = useCallback(async () => {
    try {
      let storageKey = weeklyReportStorageKey;

      if (!storageKey) {
        const user = await getCurrentUser();
        if (!user?.id) {
          return;
        }
        const weekWindow = getPreviousSundaySaturdayWindow();
        storageKey = buildWeeklyRecapViewedKey(
          user.id,
          weekWindow.weekStart,
          weekWindow.weekEnd,
        );
        setWeeklyReportStorageKey(storageKey);
      }

      await AsyncStorage.setItem(storageKey, "true");
      setWeeklyReportComplete(true);
      hasShownWeeklyReportModalThisSession = true;
    } catch (error) {
      console.warn("Could not persist weekly recap viewed state", error);
      setWeeklyReportComplete(true);
      hasShownWeeklyReportModalThisSession = true;
    }
  }, [weeklyReportStorageKey]);

  const openWeeklyRecap = useCallback(async () => {
    await markWeeklyRecapViewed();
    setShowWeeklyReportModal(false);
    router.navigate("/modal");
  }, [markWeeklyRecapViewed, router]);

  const getWeeklyReportAvailability = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      if (!user?.created_at) {
        setWeeklyReportAvailable(false);
        setWeeklyReportStorageKey(null);
        setWeeklyReportComplete(false);
        return;
      }

      const createdAt = new Date(user.created_at).getTime();
      const diffDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
      const available = diffDays >= 7;
      setWeeklyReportAvailable(available);

      const weekWindow = getPreviousSundaySaturdayWindow();
      const storageKey = buildWeeklyRecapViewedKey(
        user.id,
        weekWindow.weekStart,
        weekWindow.weekEnd,
      );
      setWeeklyReportStorageKey(storageKey);

      const hasViewedThisWeek =
        (await AsyncStorage.getItem(storageKey)) === "true";
      setWeeklyReportComplete(hasViewedThisWeek);

      if (
        available &&
        !hasViewedThisWeek &&
        !hasShownWeeklyReportModalThisSession
      ) {
        setShowWeeklyReportModal(true);
        hasShownWeeklyReportModalThisSession = true;
      }
    } catch (error) {
      console.warn("Could not determine weekly report availability", error);
      setWeeklyReportAvailable(false);
      setWeeklyReportStorageKey(null);
      setWeeklyReportComplete(false);
    }
  }, []);

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

  const handleDatePress = (date: string) => {
    setSelectedDate(date);
    handleMenuClick("date");
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
      let active = true;

      const run = async () => {
        try {
          setIsLoading(true);

          const completed = await hasCompletedDailyCheckInToday();
          if (!active) return;
          setDailyCheckInComplete(completed);

          await fetchActivePlan();
          if (!active) return;
          await getWeeklyReportAvailability();
          if (!active) return;
          setIsLoading(false);

          if (!completed) {
            try {
              const user = await getCurrentUser();
              let sameDay = false;
              if (user && user.created_at) {
                const created = new Date(user.created_at);
                const now = new Date();
                sameDay =
                  created.getUTCFullYear() === now.getUTCFullYear() &&
                  created.getUTCMonth() === now.getUTCMonth() &&
                  created.getUTCDate() === now.getUTCDate();
              }
              setIsFirstDayFlag(sameDay);

              if (sameDay && showIntro === "false") {
                if (!hasShownWelcomeModalThisSession) {
                  setShowWelcomeModal(true);
                  hasShownWelcomeModalThisSession = true;
                }
              } else if (!sameDay) {
                if (!hasShownCheckinModalThisSession) {
                  setShowCheckinModal(true);
                  hasShownCheckinModalThisSession = true;
                }
              }
            } catch (err) {
              console.warn("Error checking user creation date", err);
              // Fallback: show checkin modal if not completed — only once per session
              if (!hasShownCheckinModalThisSession) {
                setShowCheckinModal(true);
                hasShownCheckinModalThisSession = true;
              }
            }
          }
        } catch (err) {
          console.error(err);
          setIsLoading(false);
        }
      };

      run();

      return () => {
        active = false;
      };
    }, [showIntro]),
  );

  useEffect(() => {
    const nextCompletedTasks = todaysTasks.filter(
      (task) => task.completed,
    ).length;
    setCompletedTasks(nextCompletedTasks);

    if (todaysTasks.length === nextCompletedTasks && todaysTasks.length > 0) {
      cancelCompletionReminder();
    }

    const todayKey = getCurrentDateWithTimezoneOffset();
    const isFullyComplete =
      todaysTasks.length > 0 && nextCompletedTasks === todaysTasks.length;

    if (
      isFullyComplete &&
      dailyPlanCompletionTrackedForDay.current !== todayKey
    ) {
      dailyPlanCompletionTrackedForDay.current = todayKey;
      void trackEvent("daily_plan_completed", {
        date: todayKey,
        total_tasks: todaysTasks.length,
      });
    }
  }, [todaysTasks]);

  const renderMenuComponent = () => {
    switch (selectedMenu) {
      case "settings":
        return <Settings />;
      case "checkin":
        return <DailyCheckinRecap aiSummary={aiSummary} />;
      case "date":
        return selectedDate ? (
          <DatePlanRecap
            date={selectedDate}
            onDateChange={setSelectedDate}
            latentPlan={latentPlan}
          />
        ) : null;
    }
  };

  // TODO: Implement logic to determine if it's the first day of the plan. For now, returning false as a placeholder.
  const isFirstDay = () => {
    return isFirstDayFlag;
  };

  if (isLoading && showIntro === "true") {
    return <PulseText route="home" />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        {/* <ActivityIndicator size="large" color="white" /> */}
        <Loader />
      </View>
    );
  }

  if (getCurrentUser != null && todaysTasks) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
        <Header handleSettingsClick={() => handleMenuClick("settings")} />
        {/* <DailyProgress completed={completedTasks} total={todaysTasks.length} /> */}
        <ScrollView style={{ marginBottom: -35 }}>
          <View style={{ padding: 5, paddingVertical: 5, marginBottom: 20 }}>
            {dailyCheckInComplete && completedTasks === todaysTasks.length && (
              <EverythingCompletedTile />
            )}
            {isFirstDay() && <WelcomeTile />}
            {!dailyCheckInComplete && !isFirstDay() && (
              <DailyCheckInTile
                dailyCheckInComplete={dailyCheckInComplete}
                setDailyCheckInComplete={setDailyCheckInComplete}
                todaysTasks={latentPlan}
                handleDailyCheckinMenuPress={() =>
                  router.push("/(tabs)/CheckIn")
                }
              />
            )}
            <GoalCard
              goal={goal}
              completed={completedTasks}
              total={todaysTasks.length}
              onEdit={() => router.push("/plan")}
            />

            <HabitsStreaksLayout
              refreshKey={calendarRefreshKey}
              statusOverrides={calendarStatusOverrides}
              onDatePress={handleDatePress}
            />

            <TodaysPlan
              aiSummary={aiSummary}
              dailyCheckInComplete={dailyCheckInComplete}
              isFirstDay={isFirstDay}
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

            {dailyCheckInComplete && !isFirstDay() && (
              <DailyCheckInTile
                dailyCheckInComplete={dailyCheckInComplete}
                setDailyCheckInComplete={setDailyCheckInComplete}
                todaysTasks={todaysTasks}
                handleDailyCheckinMenuPress={() => handleMenuClick("checkin")}
              />
            )}

            {weeklyReportAvailable && (
              <WeeklyReportTile
                weeklyReportComplete={weeklyReportComplete}
                setWeeklyReportComplete={setWeeklyReportComplete}
                onOpenRecap={openWeeklyRecap}
              />
            )}
            <Modal
              visible={showCheckinModal}
              onClose={() => setShowCheckinModal(false)}
              title="Daily Check-in Available"
              showCloseIcon={true}
            >
              <ThemedText>
                A short 30-second daily check-in is available to help you
                reflect and plan your day.
              </ThemedText>

              <View style={{ height: 16 }} />
              <Button
                label="Start Check-in"
                type="primary"
                onPress={() => {
                  setShowCheckinModal(false);
                  router.push({
                    pathname: "/(tabs)/CheckIn",
                    params: {
                      todaysTasks: JSON.stringify(todaysTasks),
                      isDailyCheckInComplete: "false",
                    },
                  });
                }}
              />
            </Modal>

            <Modal
              visible={showWeeklyReportModal}
              onClose={() => setShowWeeklyReportModal(false)}
              title="Weekly recap is ready"
              showCloseIcon={true}
            >
              <ThemedText>
                Your weekly recap is ready. It looks back at the previous Sunday
                through Saturday and highlights how your week went.
              </ThemedText>

              <View style={{ height: 16 }} />
              <Button
                label="View weekly recap"
                type="primary"
                onPress={() => {
                  void openWeeklyRecap();
                }}
              />
            </Modal>

            <Modal
              visible={showWelcomeModal}
              showCloseIcon={false}
              onClose={() => setShowWelcomeModal(false)}
              title="Welcome to Aspyr"
            >
              <ThemedText style={{ textAlign: "center" }}>
                Make progress without perfection.
              </ThemedText>

              <View style={{ height: 12 }} />

              {/* <ThemedText style={{ color: "#A1A1AA", marginBottom: 8 }}>
                Quick tips:
              </ThemedText> */}
              <View style={styles.modalTextContainer}>
                {/* <Text style={styles.dash}>-</Text> */}
                <ThemedText
                  style={{
                    color: "#A1A1AA",
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  Today's Plan lists your prioritized tasks. Check them off as
                  you go.
                </ThemedText>
              </View>

              <View style={styles.modalTextContainer}>
                {/* <Text style={styles.dash}>-</Text> */}
                <ThemedText
                  style={{
                    color: "#A1A1AA",
                    marginBottom: 4,
                    textAlign: "center",
                  }}
                >
                  Complete the daily check-in to automatically adjust your plan.
                </ThemedText>
              </View>

              <View style={styles.modalTextContainer}>
                {/* <Text style={styles.dash}>-</Text> */}
                <ThemedText
                  style={{
                    color: "#A1A1AA",
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  The consistency calendar tracks consistency and habits over
                  time.
                </ThemedText>
              </View>

              <Button
                label="Get Started"
                type="primary"
                onPress={() => setShowWelcomeModal(false)}
              />
            </Modal>
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

const styles = StyleSheet.create({
  modalTextContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    padding: 10,
  },
  dash: {
    color: "#A1A1AA",
    fontWeight: "bold",
    marginTop: 4,
    paddingRight: 4,
  },
});
