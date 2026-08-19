import { ThemedText } from "@/components/themed-text";
import Card from "@/components/ui/Card";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, View } from "react-native";

export default function WelcomeTile() {
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <MaterialCommunityIcons
          name="hand-heart"
          size={36}
          color="rgba(59,130,246,0.9)"
        />
        <View style={styles.content}>
          <ThemedText type="subtitle">Welcome to Aspyr</ThemedText>

          <View style={{ height: 8 }} />

          <ThemedText style={styles.stepTitle}>01 — Act</ThemedText>
          <ThemedText style={styles.stepText}>
            Follow your personalized daily plan.
          </ThemedText>

          <View style={{ height: 6 }} />

          <ThemedText style={styles.stepTitle}>02 — Check in</ThemedText>
          <ThemedText style={styles.stepText}>
            Tell Aspyr how your day went.
          </ThemedText>

          <View style={{ height: 6 }} />

          <ThemedText style={styles.stepTitle}>03 — Adapt</ThemedText>
          <ThemedText style={styles.stepText}>
            Your plan evolves based on your progress.
          </ThemedText>

          <View style={{ height: 10 }} />

          <ThemedText style={styles.blurb}>
            Your first check-in will be available tomorrow.
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(77, 125, 221, 0.15)",
    borderColor: "rgba(59,130,246,0.14)",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E6EEF8",
    marginTop: 4,
  },
  stepText: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 2,
  },
  blurb: {
    fontSize: 13,
    color: "#A1A1AA",
    marginTop: 6,
    fontStyle: "italic",
  },
});
