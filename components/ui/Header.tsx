import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Header({
  handleSettingsClick,
}: {
  handleSettingsClick: () => void;
}) {
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
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingBottom: 4,
          }}
        >
          <Image
            style={{ width: 30, height: 30 }}
            source={require("../../assets/images/logo.png")}
          />
          <Text
            style={{
              lineHeight: 36,
              fontWeight: "500",
              fontSize: 32,
              // color: "#ebc27b",
              color: "#c7cbda",
              marginBottom: -10,
              paddingBottom: 4,
              letterSpacing: 10,
              textAlign: "center",
            }}
          >
            SPYR
          </Text>
        </View>

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
        onPress={handleSettingsClick}
        style={{ position: "absolute", right: 15, top: 15 }}
      >
        <MaterialIcons name="settings" color="#A1A1AA" size={24} />
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
    paddingVertical: 5,
  },
  text: {
    fontSize: 24,
  },
});
