import {
  Commitments,
  DaysOfWeek
} from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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

  return (
    <View style={styles.container}>
      <Text style={styles.titleText}>{commitment.title}</Text>
      {commitment.routines.map((routine, index) => (
        <View key={index}>
          {routine.tasks.map((task, i) => (
            <View key={`${index}${i}`}>
              <CheckListItem  title={task.title} description={task.description} task={task}>
                <Text style={{  fontSize: 12,
                  fontWeight: 600,
                  color:  colors.text,
                  letterSpacing: 1, 
                }}>
                  Frequency:{" "}
                  {routine.frequency === "daily"
                    ? "Daily"
                    : "Weekly on " +
                      formatDays(getDayOfWeekValues(routine.days_of_week))}
                </Text>
              </CheckListItem>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const CheckListItem = ({
  title,
  defaultChecked = true,
  description,
  children,
  task,
}: {
  title?: string;
  defaultChecked?: boolean;
  description?: string;
  children?: React.ReactNode;
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

  return (
    <Pressable
      onPress={() => setIsChecked(!isChecked)}
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
              color: isChecked ? colors.text : "#A1A1AA",
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
              color: isChecked ? colors.text: "#A1A1AA",
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
              color: isChecked ? colors.text : "#A1A1AA",
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
