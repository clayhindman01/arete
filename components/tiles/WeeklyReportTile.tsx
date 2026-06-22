import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import Card from "../ui/Card";

export default function WeeklyReportTile({
  weeklyReportComplete,
  setWeeklyReportComplete,
}: {
  weeklyReportComplete: boolean;
  setWeeklyReportComplete: (complete: boolean) => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.navigate("/modal");
    setWeeklyReportComplete(true);
  };

  return (
    <Card
      style={{
        backgroundColor: weeklyReportComplete
          ? "rgba(34, 197, 94, 0.08)"
          : "rgba(99, 102, 241, 0.08)",
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
          name="trending-up"
          color={
            weeklyReportComplete
              ? "rgba(34, 197, 94, 0.7)"
              : "rgba(99, 102, 241, 0.7)"
          }
          size={40}
        />
        <View>
          <Text
            style={{
              color: colors.text,
              fontWeight: 600,
              fontSize: 14,
              letterSpacing: 1,
            }}
          >
            WEEKLY REPORT
          </Text>
          <Text style={{ fontSize: 12, color: "#A1A1AA", paddingTop: 5 }}>
            {weeklyReportComplete
              ? "Review your weekly report."
              : "Your perfomance review is ready!"}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={handlePress}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: weeklyReportComplete
            ? "rgba(34, 197, 94, 0.2)"
            : "rgba(99, 102, 241, 0.5)",
          marginTop: 10,
          padding: 10,
          borderRadius: 5,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: 500, letterSpacing: 1 }}>
          View Report
        </Text>
      </TouchableOpacity>
    </Card>
  );
}
