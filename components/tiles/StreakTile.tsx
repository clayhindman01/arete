import { Text, View } from "react-native";
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
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 5,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "#71717A",
            fontSize: 28,
            fontWeight: "bold",
          }}
        >
          5
        </Text>
        <Text style={{ color: "#71717A", fontSize: 12, fontWeight: 500 }}>
          Days
        </Text>
      </View>
    </Card>
  );
}
