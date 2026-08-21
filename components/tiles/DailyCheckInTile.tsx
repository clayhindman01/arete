import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "../ui/Card";

export default function DailyCheckInTile({
  dailyCheckInComplete,
  setDailyCheckInComplete,
  todaysTasks,
  handleDailyCheckinMenuPress,
  onStartPress,
}: {
  dailyCheckInComplete: boolean;
  setDailyCheckInComplete: (complete: boolean) => void;
  todaysTasks: any;
  handleDailyCheckinMenuPress: () => void;
  onStartPress?: () => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onStartPress) {
      onStartPress();
      return;
    }

    router.push({
      pathname: "/(tabs)/CheckIn",
      params: {
        todaysTasks: JSON.stringify(todaysTasks),
        isDailyCheckInComplete: dailyCheckInComplete ? "true" : "false",
      },
    });
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: dailyCheckInComplete
            ? "rgba(34, 197, 94, 0.14)"
            : "rgba(245, 158, 11, 0.08)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: dailyCheckInComplete
                ? "rgba(34, 197, 94, 0.12)"
                : "rgba(245, 158, 11, 0.12)",
            },
          ]}
        >
          <MaterialCommunityIcons
            name="calendar-check"
            color={dailyCheckInComplete ? "#86EFAC" : "#FCD34D"}
            size={28}
          />
        </View>

        <View style={styles.textWrap}>
          <Text
            style={[
              styles.eyebrow,
              { color: dailyCheckInComplete ? "#86EFAC" : "#FCD34D" },
            ]}
          >
            Daily check-in
          </Text>
          <Text style={styles.title}>Set your focus for today</Text>
          <Text style={styles.subtitle}>
            {dailyCheckInComplete
              ? "Your check-in is complete. Review your responses anytime."
              : "Reflect on yesterday and prepare for today."}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={
          dailyCheckInComplete ? handleDailyCheckinMenuPress : handlePress
        }
        style={[
          styles.button,
          {
            backgroundColor: dailyCheckInComplete
              ? "rgba(34, 197, 94, 0.6)"
              : "rgba(245, 158, 11, 0.5)",
          },
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          {dailyCheckInComplete ? "View responses" : "Start check-in"}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  title: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
  },
  subtitle: {
    color: "#A1A1AA",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  button: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
