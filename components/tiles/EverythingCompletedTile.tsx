import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function EverythingCompletedTile() {
  return (
    <Card style={{ backgroundColor: "rgba(34, 197, 94, 0.08)" }}>
      <View style={styles.container}>
        <MaterialCommunityIcons
          name="check-circle-outline"
          color="rgba(34, 197, 94, 0.7)"
          size={50}
        />
        <View style={{ paddingLeft: 10 }}>
          <Text style={styles.titleText}>TODAY COMPLETE</Text>
          <Text style={styles.subText}>Well done finishing all tasks!</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: 600,
    color: "#F5F5F5",
  },
  subText: {
    fontSize: 14,
    color: "#A1A1AA",
    letterSpacing: 1,
    paddingVertical: 5
  },
});
