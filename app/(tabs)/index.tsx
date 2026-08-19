import DailyProgress from "@/components/DailyProgress";
import HabitsStreaksLayout from "@/components/HabitsStreaksLayout";
import { ThemedText } from "@/components/themed-text";
import DailyCheckInTile from "@/components/tiles/DailyCheckInTile";
import EverythingCompletedTile from "@/components/tiles/EverythingCompletedTile";
import TodaysPlan from "@/components/tiles/TodaysPlan";
import WelcomeTile from "@/components/tiles/WelcomeTile";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DailyCheckinRecap from "@/components/ui/DailyCheckinRecap";
import Header from "@/components/ui/Header";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";
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
import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Settings from "./Settings";

// Session-scoped flags to ensure modals only appear once per app session
let hasShownCheckinModalThisSession = false;
let hasShownWelcomeModalThisSession = false;

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
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isFirstDayFlag, setIsFirstDayFlag] = useState(false);
  const router = useRouter();

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
      let active = true;

      const run = async () => {
        try {
          setIsLoading(true);

          const completed = await hasCompletedDailyCheckInToday();
          if (!active) return;
          setDailyCheckInComplete(completed);

          await fetchActivePlan();
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
    setCompletedTasks(todaysTasks.filter((task) => task.completed).length);
    if (todaysTasks.length === completedTasks && todaysTasks.length > 0) {
      cancelCompletionReminder();
    }
  }, [todaysTasks]);

  const renderMenuComponent = () => {
    switch (selectedMenu) {
      case "settings":
        return <Settings />;
      case "checkin":
        return <DailyCheckinRecap aiSummary={aiSummary} />;
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
            <HabitsStreaksLayout
              refreshKey={calendarRefreshKey}
              statusOverrides={calendarStatusOverrides}
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
            <Modal
              visible={showCheckinModal}
              onClose={() => setShowCheckinModal(false)}
              title="Daily Check-in Available"
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
              visible={showWelcomeModal}
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
