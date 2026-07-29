import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function HabitTile() {
  const { colors } = useTheme();

  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const monthMap = new Map([
    [0, "January"],
    [1, "February"],
    [2, "March"],
    [3, "April"],
    [4, "May"],
    [5, "June"],
    [6, "July"],
    [7, "August"],
    [8, "September"],
    [9, "October"],
    [10, "November"],
    [11, "December"],
  ]);

  const [viewDate, setViewDate] = useState(() => new Date());
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayIndex = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();
  const leadingEmptyDays = firstDayIndex;
  const totalCells = leadingEmptyDays + daysInMonth;
  const trailingEmptyDays = (7 - (totalCells % 7)) % 7;

  const calendarDays = Array.from(
    { length: leadingEmptyDays + daysInMonth + trailingEmptyDays },
    (_, index) => {
      const dayNumber = index - leadingEmptyDays + 1;
      return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
    },
  );

  const weeks = Array.from(
    { length: Math.ceil(calendarDays.length / 7) },
    (_, index) => calendarDays.slice(index * 7, index * 7 + 7),
  );

  const goToPreviousMonth = () => {
    setViewDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setViewDate(
      (currentDate) =>
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  return (
    <Card style={styles.container}>
      <Pressable style={styles.navigationChevron} onPress={goToPreviousMonth}>
        <MaterialCommunityIcons
          name="chevron-left"
          size={50}
          color={colors.text}
        />
      </Pressable>
      <View>
        <View>
          <Text style={styles.titleText}>
            {`${monthMap.get(month)?.toUpperCase()} ${year.toString()}`}
          </Text>
        </View>
        <View style={styles.headerContainer}>
          {days.map((day, index) => (
            <DayText day={day} key={index} />
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View style={styles.headerContainer} key={weekIndex}>
            {week.map((day, dayIndex) => (
              <HabitBox key={`${weekIndex}-${dayIndex}`} day={day} />
            ))}
          </View>
        ))}
      </View>
      <Pressable style={styles.navigationChevron} onPress={goToNextMonth}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={50}
          color={colors.text}
        />
      </Pressable>
    </Card>
  );
}

const DayText = ({ day }: { day: string }) => {
  return (
    <View style={{ width: 25, alignItems: "center" }}>
      <Text style={{ color: "#A1A1AA", textAlign: "center" }}>{day}</Text>
    </View>
  );
};

const HabitBox = ({
  completed = false,
  day,
}: {
  completed?: boolean;
  day?: number | null;
}) => {
  const isVisibleDay = day !== null && day !== undefined;

  return (
    <View
      style={[
        styles.habitBox,
        completed && styles.filledIn,
        isVisibleDay && styles.dayVisible,
      ]}
    >
      {isVisibleDay ? (
        <Text style={styles.dayText}>{day}</Text>
      ) : (
        completed && (
          <MaterialCommunityIcons name="check" color="#111318" size={14} />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
  },
  titleText: {
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 5,
    letterSpacing: 1,
    color: "#A1A1AA",
    textAlign: "center",
  },
  headerContainer: {
    gap: 5,
    display: "flex",
    // width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 5,
  },
  streakIconContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 5,
  },
  habitBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 25,
    width: 25,
    borderRadius: 3,
  },
  dayVisible: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#A1A1AA",
  },
  filledIn: {
    backgroundColor: "#b89b5e",
    borderColor: "#111318",
  },
  dayText: {
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "600",
  },
  navigationChevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },
});
