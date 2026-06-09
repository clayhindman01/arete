import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function StreaksTile() {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={{ display: "flex", flexDirection: "row" }}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={[styles.titleText, { color: colors.text }]}>
              Habits
            </Text>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                width: "60%",
                justifyContent: "space-around",
                paddingRight: 5,
              }}
            >
              <DayText day="M" />
              <DayText day="T" />
              <DayText day="W" />
              <DayText day="T" />
              <DayText day="F" />
              <DayText day="S" />
              <DayText day="S" />
            </View>
          </View>
          <StreakItem title="Walk" />
          <StreakItem title="Read" />
          <StreakItem title="Journal" />
        </View>

        <View style={styles.containerRight}>
          <View style={[styles.headerContainer, { paddingLeft: 5 }]}>
            <MaterialIcons name="trending-up" color={colors.text} size={22} />
            <Text style={[styles.titleText, { color: colors.text }]}>
              Daily Streak
            </Text>
          </View>

          <View
            style={{
              display: "flex",
              justifyContent: "center",
              //   marginTop: 10,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 60,
                fontWeight: "bold",
              }}
            >
              0
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const DayText = ({ day }: { day: string }) => {
  return <Text style={{ color: "gray" }}>{day}</Text>;
};

const StreakItem = ({ title }: { title: string }) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{ display: "flex", flexDirection: "row", alignItems: "center" }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            fontWeight: 400,
          }}
        >
          {title}
        </Text>
      </View>
      <View style={styles.streakIconContainer}>
        <HabitBox completed={true} />
        <HabitBox completed={true} />
        <HabitBox completed={true} />
        <HabitBox />
        <HabitBox completed={true} />
        <HabitBox completed={true} />
        <HabitBox />
      </View>
    </View>
  );
};

const HabitBox = ({ completed = false }: { completed?: boolean }) => {
  return <View style={[styles.habitBox, completed && styles.filledIn]} />;
};

const styles = StyleSheet.create({
  container: {
    width: "60%",
    display: "flex",
    borderRightColor: "rgba(122, 120, 120, 0.5)",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  containerRight: {
    width: "40%",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 5,
  },
  streakIconContainer: {
    width: "60%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingRight: 5,
  },
  habitBox: {
    height: 14,
    width: 14,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  filledIn: {
    backgroundColor: "rgb(103, 189, 122)",
  },
});
