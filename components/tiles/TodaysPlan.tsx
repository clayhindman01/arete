import { logEvent } from "@/lib/analytics";
import { toggleTask } from "@/lib/db";
import { Tasks } from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { type Dispatch, type SetStateAction, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function TodaysPlan({
  dailyCheckInComplete,
  todaysTasks,
  setTodaysTasks,
  aiSummary,
  onTaskToggle,
  isFirstDay,
}: {
  dailyCheckInComplete: boolean;
  todaysTasks: Tasks[];
  setTodaysTasks: Dispatch<SetStateAction<Tasks[]>>;
  aiSummary: string;
  onTaskToggle?: (task: Tasks, nextValue: boolean) => void;
  isFirstDay: () => boolean;
}) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: "#A1A1AA" }]}>
          TODAY'S PLAN
        </Text>
      </View>
      {aiSummary && dailyCheckInComplete && (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingLeft: 5,
            paddingBottom: 5,
          }}
        >
          <Text
            style={{
              color: "#A1A1AA",
              letterSpacing: 1,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {aiSummary}
          </Text>
        </View>
      )}
      {!dailyCheckInComplete && !isFirstDay() && (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingLeft: 5,
            paddingBottom: 5,
          }}
        >
          <MaterialCommunityIcons
            name="alert-outline"
            color="rgba(245, 158, 11, 0.7)"
            size={20}
          />
          <Text
            style={{
              color: "#A1A1AA",
              letterSpacing: 1,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Complete Daily Check-in to personalize
          </Text>
        </View>
      )}
      {todaysTasks.map((task: any, index: number) => (
        <View key={index}>
          <CheckListItem
            title={task.title}
            description={task.description}
            defaultChecked={task.completed}
            task={task}
            setTodaysTasks={setTodaysTasks}
            onTaskToggle={onTaskToggle}
          />
        </View>
      ))}
    </Card>
  );
}

const CheckListItem = ({
  title,
  defaultChecked = false,
  description,
  setTodaysTasks,
  task,
  onTaskToggle,
}: {
  title?: string;
  defaultChecked?: boolean;
  description?: string;
  setTodaysTasks?: Dispatch<SetStateAction<Tasks[]>>;
  task?: Tasks;
  onTaskToggle?: (task: Tasks, nextValue: boolean) => void;
}) => {
  const { colors } = useTheme();
  const [isChecked, setIsChecked] = useState<boolean>(defaultChecked);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const renderTextContent = (value: unknown, textStyle: object) => {
    if (value == null || value === "") {
      return null;
    }

    return <Text style={textStyle}>{String(value)}</Text>;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTaskCompletion = async () => {
    const nextValue = !isChecked;

    if (!task) {
      setIsChecked(nextValue);
      return;
    }

    if (task.id && setTodaysTasks) {
      setTodaysTasks((prev: Tasks[]) =>
        prev.map((t: Tasks) =>
          t.id === task.id
            ? {
                ...t,
                completed: nextValue,
              }
            : t,
        ),
      );
    }

    try {
      if (task.id) {
        await toggleTask(task.id, nextValue).then(() => {});
      }
      onTaskToggle?.(task, nextValue);
      // fire-and-forget analytics for task completion
      if (nextValue === true && task?.id) {
        void logEvent("task_completed", {
          task_id: task.id,
          title: task.title ?? null,
          estimated_minutes: task.estimated_minutes ?? null,
        });
      }
    } catch (error) {
      console.error("Failed to toggle task", error);
    }

    setIsChecked(nextValue);
  };

  return (
    <View>
      <View style={styles.checkListItem}>
        <Pressable
          onPress={() =>
            task ? void handleTaskCompletion() : setIsChecked(!isChecked)
          }
          style={[
            styles.circle,
            isChecked ? styles.complete : styles.incomplete,
          ]}
        >
          {isChecked && (
            <MaterialCommunityIcons name="check" color="black" size={14} />
          )}
        </Pressable>
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={{
            paddingHorizontal: 10,
            width: "75%",
          }}
        >
          {title &&
            renderTextContent(title, {
              fontSize: 16,
              color: isChecked ? "#A1A1AA" : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              textDecorationColor: "#b89b5e",
              letterSpacing: 1.5,
              textAlign: "center",
            })}
        </Pressable>
        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            color={colors.text}
            size={30}
          />
        </Pressable>
      </View>
      {isExpanded && (
        <View
          style={{
            width: "100%",
            paddingHorizontal: 40,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {description &&
            renderTextContent(description, {
              fontSize: 12,
              color: isChecked ? "#A1A1AA" : colors.text,
              // textDecorationLine: isChecked ? "line-through" : "none",
              textDecorationColor: "#b89b5e",
              letterSpacing: 1,
              textAlign: "center",
            })}
          {task?.estimated_minutes != null &&
            renderTextContent(
              `Estimated Time: ${formatTime(task.estimated_minutes)}`,
              {
                fontSize: 12,
                fontWeight: 600,
                color: isChecked ? "#A1A1AA" : colors.text,
                // textDecorationLine: isChecked ? "line-through" : "none",
                textDecorationColor: "#b89b5e",
                letterSpacing: 1,
                paddingVertical: 5,
              },
            )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 14,
    color: "#F5F5F5",
    fontWeight: 600,
    letterSpacing: 1,
    // textAlign: "center",
  },
  titleSubText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: 600,
  },
  checkListItem: {
    padding: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circle: {
    borderRadius: 100,
    height: 20,
    width: 20,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  incomplete: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  complete: {
    backgroundColor: "#b89b5e",
  },
});
