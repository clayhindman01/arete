import {
  Commitments,
  DaysOfWeek,
  Routines,
  Tasks,
} from "@/types/PlanGeneration";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import { CheckListItem } from "../tiles/TodaysPlan";

export default function PlanComponent({
  commitment,
}: {
  commitment: Commitments;
}) {
  const { colors } = useTheme();

  const getDayOfWeekValues = (day_of_week: DaysOfWeek[]) => {
    let days = [];
    for (const day of day_of_week) {
      switch (day) {
        case "M":
          days.push("Monday");
          break;
        case "T":
          days.push("Tuesday");
          break;
        case "W":
          days.push("Wednesday");
          break;
        case "Th":
          days.push("Thursday");
          break;
        case "F":
          days.push("Friday");
          break;
        case "S":
          days.push("Saturday");
          break;
        case "Su":
          days.push("Sunday");
          break;
      }
    }
    return days;
  };

  const formatDays = (days: any) => {
    if (days.length === 0) return "";
    if (days.length === 1) return days[0];

    // Joins all items except the last with a comma, then appends the last item
    return days.slice(0, -1).join(", ") + " and " + days.slice(-1);
  };

  const createPlanChecklistLabel = (routine: Routines, task: Tasks) => {
    console.log("task", task);
    if (routine.frequency === "weekly") {
      const days = getDayOfWeekValues(routine.days_of_week);
      return `${task.title} ${formatDays(days)}\nEstimated Time: ${task.estimated_minutes} min`;
    } else {
      return `${task.description}\nEstimated Time: ${task.estimated_minutes} min`;
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{commitment.title}</Text>
      {commitment.routines.map((routine, index) => (
        <View key={index}>
          {routine.tasks.map((task, i) => (
            <View key={`${index}${i}`}>
              <CheckListItem defaultChecked={true} grayOnCheck={false}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={{ color: colors.text }}>{task.description}</Text>
                <Text style={{ color: colors.text }}>
                  Frequency:{" "}
                  {routine.frequency === "daily"
                    ? "Daily"
                    : "Weekly on " +
                      formatDays(getDayOfWeekValues(routine.days_of_week))}
                </Text>
                <Text style={{ color: colors.text }}>
                  Estimated Time: {task.estimated_minutes} min
                </Text>
              </CheckListItem>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "700",
    // textAlign: "center",
    lineHeight: 32,
    color: "white",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  bulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: "gray",
  },
});
