import { View } from "react-native";
import HabitTile from "./tiles/HabitTile";
import StreakTile from "./tiles/StreakTile";

export default function HabitsStreaksLayout() {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
      }}
    >
      <HabitTile />
      <StreakTile />
    </View>
  );
}
