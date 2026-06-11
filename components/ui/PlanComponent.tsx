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

  const getDayOfWeekValues = (day_of_week: DaysOfWeek) => {
    let days = [];
    for (const day of day_of_week) {
      switch (day) {
        case 0:
          days.push("Monday");
          break;
        case 1:
          days.push("Tueday");
          break;
        case 2:
          days.push("Wednesday");
          break;
        case 3:
          days.push("Thursday");
          break;
        case 4:
          days.push("Friday");
          break;
        case 5:
          days.push("Saturday");
          break;
        case 6:
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
    if (routine.frequency === "weekly") {
      const days = getDayOfWeekValues(routine.days_of_week);
      return `${task.title} ${formatDays(days)}\nEstimated Time: ${task.estimated_minutes} min`;
    } else {
      return `${task.title} ${routine.frequency}\nEstimated Time: ${task.estimated_minutes} min`;
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{commitment.title}</Text>
      {/* <Text style={{ color: colors.text }}>{commitment.description}</Text> */}
      {commitment.routines.map((routine, index) => (
        <View key={index}>
          {/* <Text style={styles.titleText}>{routine.title}</Text> */}
          {routine.tasks.map((task, i) => (
            <View key={`${index}${i}`}>
              <CheckListItem
                title={createPlanChecklistLabel(routine, task)}
                defaultChecked={true}
                isLastElement={true}
                grayOnCheck={false}
              />
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
  bulletPoint: {
    width: 10,
    height: 10,
    borderRadius: 20,
    backgroundColor: "gray",
  },
});
