import { getDailyPlan } from "@/lib/db";
import { getCurrentDateWithTimezoneOffset } from "@/lib/utils";
import { Tasks } from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type DatePlanRecapProps = {
  date: string;
  onDateChange: (date: string) => void;
  latentPlan: {
    weekly_task_pool?: (Tasks & { allowed_days?: string[] })[];
  } | null;
};

const dayMap = ["Su", "M", "T", "W", "Th", "F", "S"];

export default function DatePlanRecap({
  date,
  onDateChange,
  latentPlan,
}: DatePlanRecapProps) {
  const [tasks, setTasks] = useState<Tasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFuture = date > getCurrentDateWithTimezoneOffset();

  useEffect(() => {
    let isActive = true;

    const loadTasks = async () => {
      setIsLoading(true);
      try {
        if (isFuture) {
          const selectedDate = new Date(`${date}T12:00:00`);
          const weekday = dayMap[selectedDate.getDay()];
          const futureTasks = (latentPlan?.weekly_task_pool ?? [])
            .filter((task) => task.allowed_days?.includes(weekday))
            .map((task) => ({ ...task, completed: false }));
          if (isActive) setTasks(futureTasks);
        } else {
          const plan = await getDailyPlan(date);
          if (isActive) {
            setTasks(
              (plan?.daily_tasks ?? []).map((task: any) => ({
                id: task.id,
                title: task.title ?? "",
                description: task.description ?? "",
                estimated_minutes: task.estimated_minutes ?? 0,
                one_word_description: task.one_word_description ?? "",
                completed: Boolean(task.completed),
              })),
            );
          }
        }
      } catch (error) {
        console.error("Failed to load daily plan", error);
        if (isActive) setTasks([]);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void loadTasks();
    return () => {
      isActive = false;
    };
  }, [date, isFuture, latentPlan]);

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    },
  );

  if (isLoading) return <ActivityIndicator style={styles.loader} />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.dateNavigation}>
        <Pressable
          accessibilityLabel="Previous day"
          onPress={() => onDateChange(getAdjacentDate(date, -1))}
          style={styles.navigationButton}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={32}
            color="#ecedee"
          />
        </Pressable>
        <Text style={styles.title}>{formattedDate}</Text>
        <Pressable
          accessibilityLabel="Next day"
          onPress={() => onDateChange(getAdjacentDate(date, 1))}
          style={styles.navigationButton}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={32}
            color="#ecedee"
          />
        </Pressable>
      </View>
      <Text style={styles.subtitle}>
        {isFuture ? "UPCOMING PLAN" : "DAILY PLAN"}
      </Text>
      {isFuture ? (
        <Text style={styles.disclaimer}>
          This plan is projected and may change based on your progress.
        </Text>
      ) : null}
      {tasks.length === 0 ? (
        <Text style={styles.emptyText}>No tasks planned for this day.</Text>
      ) : (
        <TaskList tasks={tasks} />
      )}
    </ScrollView>
  );
}

function getAdjacentDate(date: string, offset: number) {
  const adjacentDate = new Date(`${date}T12:00:00`);
  adjacentDate.setDate(adjacentDate.getDate() + offset);
  return adjacentDate.toISOString().slice(0, 10);
}

function TaskList({ tasks }: { tasks: Tasks[] }) {
  return (
    <View style={styles.section}>
      {tasks.map((task) => (
        <View key={task.id ?? task.title} style={styles.taskRow}>
          <View
            style={[styles.status, task.completed && styles.statusComplete]}
          >
            {task.completed ? <Text style={styles.check}>✓</Text> : null}
          </View>
          <Text
            style={[styles.taskText, task.completed && styles.completedText]}
          >
            {task.title}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  loader: { marginTop: 48 },
  dateNavigation: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  navigationButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  title: {
    color: "#ecedee",
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  disclaimer: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
  section: { marginTop: 28 },
  taskRow: { alignItems: "center", flexDirection: "row", paddingVertical: 10 },
  status: {
    alignItems: "center",
    borderColor: "#52525b",
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: "center",
    marginRight: 12,
    width: 20,
  },
  statusComplete: { backgroundColor: "#b89b5e", borderColor: "#b89b5e" },
  check: { color: "#111318", fontSize: 13, fontWeight: "700" },
  taskText: { color: "#ecedee", flex: 1, fontSize: 15, letterSpacing: 0.4 },
  completedText: { color: "#A1A1AA", textDecorationLine: "line-through" },
  emptyText: {
    color: "#A1A1AA",
    fontSize: 15,
    paddingVertical: 36,
    textAlign: "center",
  },
});
