import { View } from "react-native";
import HabitTile from "./tiles/HabitTile";

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
      {/* <StreakTile /> */}
    </View>
  );
}
