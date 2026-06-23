import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Card from "../ui/Card";

export default function DailyCheckInTile({
  dailyCheckInComplete,
  setDailyCheckInComplete,
}: {
  dailyCheckInComplete: boolean;
  setDailyCheckInComplete: (complete: boolean) => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.navigate("/(tabs)/CheckIn");
    setDailyCheckInComplete(true);
  };

  return (
    <Card
      style={{
        backgroundColor: dailyCheckInComplete
          ? "rgba(34, 197, 94, 0.08)"
          : "rgba(245, 158, 11, 0.35)",
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
        }}
      >
        <MaterialCommunityIcons
          name="calendar"
          color={
            dailyCheckInComplete
              ? "rgba(34, 197, 94, 0.7)"
              : "rgba(245, 158, 11, 0.7)"
          }
          size={40}
        />
        <View>
          <Text
            style={{
              color: dailyCheckInComplete
                ? "rgba(34, 197, 94, 0.7)"
                : "rgba(245, 158, 11, 0.7)",
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            DAILY CHECK-IN
          </Text>
          {!dailyCheckInComplete && (
            <Text
              style={{
                fontSize: 12,
                color: dailyCheckInComplete
                  ? "rgba(34, 197, 94, 0.7)"
                  : "rgba(245, 158, 11, 0.7)",
              }}
            >
              30 seconds
            </Text>
          )}
          <Text style={{ fontSize: 12, color: "#A1A1AA", paddingTop: 5 }}>
            {dailyCheckInComplete
              ? "Completed"
              : "Reflect on yesterday and prepare for today."}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: dailyCheckInComplete
            ? "rgba(34, 197, 94, 0.2)"
            : "rgba(245, 158, 11, 0.5)",
          marginTop: 10,
          padding: 10,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: 500, letterSpacing: 1 }}>
          {dailyCheckInComplete ? "View Responses" : "Start Check-in"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}
