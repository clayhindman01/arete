import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Header() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.text, { color: colors.text }]}>
          Good morning, Clay
        </Text>
        <Text style={[styles.subText, { color: colors.text }]}>
          Current Goal: Read 10 Books this year
        </Text>
        {/* <Text style={[styles.subText, { color: colors.text }]}>
          Consistency Score: 84%
        </Text> */}
      </View>

      <TouchableOpacity onPress={() => router.navigate("/(tabs)/Settings")}>
        <MaterialIcons name="settings" color={colors.text} size={22} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 5,
    paddingVertical: 10,
  },
  text: {
    fontSize: 24,
  },
  subText: {
    fontSize: 16,
  },
});
