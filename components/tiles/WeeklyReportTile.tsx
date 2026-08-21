import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Card from "../ui/Card";

export default function WeeklyReportTile({
  weeklyReportComplete,
  setWeeklyReportComplete,
  onOpenRecap,
}: {
  weeklyReportComplete: boolean;
  setWeeklyReportComplete: (complete: boolean) => void;
  onOpenRecap?: () => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onOpenRecap) {
      void onOpenRecap();
      return;
    }
    router.navigate("/modal");
    setWeeklyReportComplete(true);
  };

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: weeklyReportComplete
            ? "rgba(139, 92, 246, 0.14)"
            : "rgba(139, 92, 246, 0.08)",
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons
            name="calendar-weekend"
            color="#C4B5FD"
            size={28}
          />
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.eyebrow}>Weekly recap</Text>
          <Text style={styles.title}>Your week in review</Text>
          <Text style={styles.subtitle}>
            {weeklyReportComplete
              ? "See how last week went and what to focus on next."
              : "Looks back at last Sunday through Saturday."}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.button,
          {
            backgroundColor: weeklyReportComplete
              ? "rgba(139, 92, 246, 0.6)"
              : "rgba(139, 92, 246, 0.5)",
          },
        ]}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          Open recap
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
    backgroundColor: "rgba(148, 163, 184, 0.12)",
  },
  textWrap: {
    flex: 1,
  },
  eyebrow: {
    color: "#C4B5FD",
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
