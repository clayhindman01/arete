import { toggleTask } from "@/lib/db";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function TodaysPlan({
  dailyCheckInComplete,
  todaysTasks,
  setTodaysTasks,
  aiSummary,
}: {
  dailyCheckInComplete: boolean;
  todaysTasks: any;
  setTodaysTasks: (tasks: any) => void;
  aiSummary: string;
}) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          TODAY'S TASKS
        </Text>

        {/* <Text style={[styles.titleSubText]}>{tasks.length} remaining</Text> */}
      </View>
      {!dailyCheckInComplete ? (
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
      ): (
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
      {todaysTasks.map((task: any, index: number) => (
        <View key={index}>
          <CheckListItem
            title={task.title}
            description={task.description}
            defaultChecked={task.completed}
            task={task}
            grayOnCheck={false}
            setTodaysTasks={setTodaysTasks}
          />
        </View>
      ))}
    </Card>
  );
}

export const CheckListItem = ({
  title,
  defaultChecked = false,
  description,
  grayOnCheck = true,
  children,
  setTodaysTasks,
  task,
}: {
  title?: string;
  defaultChecked?: boolean;
  description?: string;
  grayOnCheck?: boolean;
  children?: React.ReactNode;
  setTodaysTasks?: (tasks: any) => void;
  task?: any;
}) => {
  const { colors } = useTheme();
  const [isChecked, setIsChecked] = useState(defaultChecked);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleTaskCompletion = () => {
    if (task?.id && setTodaysTasks) {
       setTodaysTasks((prev: any) =>
        prev.map((t: any) =>
          t.id === task.id
            ? {
                ...t,
                completed: !t.completed,
              }
            : t
        )
      );
      toggleTask(task.id, !isChecked);
    }
    setIsChecked(!isChecked);
  };
  return (
    <Pressable
      onPress={() => (task ? handleTaskCompletion() : setIsChecked(!isChecked))}
      style={styles.checkListItem}
    >
      <View
        style={[styles.circle, isChecked ? styles.complete : styles.incomplete]}
      >
        {isChecked && (
          <MaterialCommunityIcons name="check" color="black" size={14} />
        )}
      </View>
      <View style={{ paddingHorizontal: 10 }}>
        {title && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: isChecked ? "#A1A1AA" : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              letterSpacing: 1,
            }}
          >
            {title}
          </Text>
        )}
        {description && (
          <Text
            style={{
              fontSize: 12,
              color: isChecked ? "#A1A1AA" : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              letterSpacing: 1,
            }}
          >
            {description}
          </Text>
        )}
        {task.estimated_minutes && (
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: isChecked ? "#A1A1AA" : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              letterSpacing: 1,
            }}
          >
            {`${formatTime(task.estimated_minutes)}`}
          </Text>
        )}
        {children}
      </View>
    </Pressable>
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
  },
  circle: {
    borderRadius: 100,
    height: 20,
    width: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  incomplete: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  complete: {
    backgroundColor: "#A1A1AA",
  },
});
