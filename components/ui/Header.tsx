import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Header() {
  const { colors } = useTheme();
  const router = useRouter();

  const today = new Date();

  return (
    <View style={styles.container}>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            lineHeight: 36,
            fontWeight: "bold",
            fontSize: 28,
            color: "#A1A1AA",
            letterSpacing: 8,
            textAlign: "center",
          }}
        >
          ARETE
        </Text>
        <Text
          style={{
            color: "#A1A1AA",
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 20,
            letterSpacing: 2,
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.navigate("/(tabs)/Settings")}
        style={{ position: "absolute", right: 15, top: 15 }}
      >
        <MaterialIcons name="settings" color="#A1A1AA" size={22} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
  },
  text: {
    fontSize: 24,
  },
});
