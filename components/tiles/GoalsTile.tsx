import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function GoalsTile() {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons name="bullseye-arrow" color="green" size={22} />
        <Text style={[styles.titleText, { color: colors.text }]}>
          Current Goals
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
    paddingBottom: 10,
  },
  titleText: {
    paddingLeft: 5,
    fontSize: 18,
    fontWeight: "bold",
  },
});
