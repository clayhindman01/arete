import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function HabitTile() {
  const { colors } = useTheme();

  const days = ["S", "M", "T", "W", "T", "F", "S"];

  const nextWeekLetters = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return days[date.getDay()];
  });

  return (
    <Card style={styles.container}>
      <View>
        <Text style={[styles.titleText, { color: "#A1A1AA" }]}>
          LAST 7 DAYS
        </Text>
      </View>
      <View style={styles.headerContainer}>
        {nextWeekLetters.map((day, index) => (
          <DayText day={day} key={index} />
        ))}
      </View>
      <StreakItem />
    </Card>
  );
}

const DayText = ({ day }: { day: string }) => {
  return (
    <View style={{ width: 20, alignItems: "center" }}>
      <Text style={{ color: "#A1A1AA", textAlign: "center" }}>{day}</Text>
    </View>
  );
};

const StreakItem = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.headerContainer}>
      <HabitBox />
      <HabitBox />
      <HabitBox completed={true} />
      <HabitBox />
      <HabitBox />
      <HabitBox />
      <HabitBox />
    </View>
  );
};

const HabitBox = ({ completed = false }: { completed?: boolean }) => {
  return (
    <View style={[styles.habitBox, completed && styles.filledIn]}>
      {completed && (
        <MaterialCommunityIcons name="check" color="black" size={14} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "65%",
    display: "flex",
    borderRightColor: "rgba(122, 120, 120, 0.5)",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 600,
    paddingBottom: 5,
    letterSpacing: 1,
  },
  headerContainer: {
    display: "flex",
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "center",
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
    height: 20,
    width: 20,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  filledIn: {
    backgroundColor: "#A1A1AA",
  },
});
