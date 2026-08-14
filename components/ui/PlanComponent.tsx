import { Commitments, DaysOfWeek } from "@/types/PlanGeneration";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
export default function PlanComponent({
  commitment,
  commitmentIndex,
  onChange,
}: {
  commitment: Commitments;
  commitmentIndex?: number;
  // onChange now emits the selection matrix (routines x tasks booleans)
  onChange?: (commitmentIndex: number, selection: boolean[][]) => void;
}) {
  const [selection, setSelection] = useState<boolean[][]>([]);

  useEffect(() => {
    // initialize selection matrix: routines x tasks
    const initial = commitment.routines.map((r) => r.tasks.map(() => true));
    setSelection(initial);
    // emit initial selection matrix
    if (onChange && typeof commitmentIndex === "number") {
      onChange(commitmentIndex, initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitment]);

  const handleToggle = (routineIndex: number, taskIndex: number) => {
    setSelection((prev) => {
      const next = prev.map((r) => [...r]);
      next[routineIndex][taskIndex] = !next[routineIndex][taskIndex];

      // emit selection matrix only
      if (onChange && typeof commitmentIndex === "number") {
        onChange(commitmentIndex, next);
      }

      return next;
    });
  };

  return (
    <View style={styles.container}>
      {commitment.routines.map((routine, rIndex) => (
        <View key={rIndex}>
          {routine.tasks.map((task, tIndex) => (
            <View key={`${rIndex}${tIndex}`}>
              <CheckListItem
                title={task.title}
                description={task.description}
                task={task}
                routine={routine}
                // render grayed when unchecked, but keep in UI
                checked={selection[rIndex] ? selection[rIndex][tIndex] ?? true : true}
                onToggle={() => handleToggle(rIndex, tIndex)}
              ></CheckListItem>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const CheckListItem = ({
  title,
  checked = true,
  description,
  children,
  task,
  routine,
  onToggle,
}: {
  title?: string;
  checked?: boolean;
  description?: string;
  children?: React.ReactNode;
  task?: any;
  routine: any;
  onToggle?: () => void;
}) => {
  const { colors } = useTheme();

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const incompleteColor = "#7d7d88";

  return (
    <TouchableOpacity onPress={onToggle} style={styles.checkListItem}>
      <View
        style={[styles.circle, checked ? styles.complete : styles.incomplete]}
      ></View>
      <View style={{ paddingHorizontal: 10 }}>
        {title && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: checked ? colors.text : incompleteColor,
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
              color: checked ? colors.text : incompleteColor,
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
              color: checked ? colors.text : incompleteColor,
              letterSpacing: 1,
            }}
          >
            {`${formatTime(task.estimated_minutes)}`}
          </Text>
        )}
        <Text
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: checked ? colors.text : incompleteColor,
            letterSpacing: 1,
          }}
        >
          Frequency: {" "}
          {routine.frequency === "daily"
            ? "Daily"
            : "Weekly on " +
              formatDays(getDayOfWeekValues(routine.days_of_week))}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    // padding: 10,
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
    height: 10,
    width: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: "#b89b5e",
    // backgroundColor: "#A1A1AA",
  },
  incomplete: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  complete: {
    backgroundColor: "#b89b5e",
  },
});
