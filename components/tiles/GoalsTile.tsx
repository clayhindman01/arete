import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text } from "react-native";
import Card from "../ui/Card";

export default function GoalsTile() {
  const { colors } = useTheme();

  return (
    <Card>
      <Text style={[styles.titleText, { color: colors.text }]}>Goal</Text>
      <Text style={[styles.subText, { color: colors.text }]}>
        Read 10 books this year
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
