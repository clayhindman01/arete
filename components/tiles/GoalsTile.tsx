import { Goal } from "@/types/PlanGeneration";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text } from "react-native";
import Card from "../ui/Card";

export default function GoalsTile({ goal }: { goal: Goal }) {
  const { colors } = useTheme();

  return (
    <Card>
      <Text style={[styles.titleText, { color: colors.text }]}>
        Goal - {goal?.title || "No goal set"}
      </Text>
      <Text style={[styles.subText, { color: colors.text }]}>
        {goal?.description || "No description"}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subText: {
    paddingTop: 10,
    fontSize: 16,
  },
});
