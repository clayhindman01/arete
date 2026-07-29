import { View } from "react-native";
import HabitTile from "./tiles/HabitTile";

export default function HabitsStreaksLayout({
  refreshKey,
  statusOverrides,
}: {
  refreshKey?: number;
  statusOverrides?: Record<string, string>;
}) {
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 10,
        justifyContent: "space-between",
      }}
    >
      <HabitTile refreshKey={refreshKey} statusOverrides={statusOverrides} />
      {/* <StreakTile /> */}
    </View>
  );
}
