import { Text } from "react-native";
import Card from "../ui/Card";

export default function StreakTile() {
  return (
    <Card
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "flex-start",
        gap: 5,
      }}
    >
      <Text
        style={{
          color: "#A1A1AA",
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        STREAK
      </Text>
      <Text style={{ color: "#71717A", fontSize: 28, fontWeight: "bold" }}>
        5
      </Text>
    </Card>
  );
}
