import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function InsightsTile({ aiSummary }: { aiSummary: string }) {
  const { colors } = useTheme();
  return (
    <Card>
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          COACH'S ADVICE
        </Text>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          // paddingLeft: 5,
          paddingBottom: 5,
        }}
      >
        <Text
          style={{
            textAlign: "justify",
            color: colors.text,
            letterSpacing: 0,
            lineHeight: 18,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {aiSummary}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 14,
    color: "#F5F5F5",
    fontWeight: 600,
    letterSpacing: 1,
  },
});
