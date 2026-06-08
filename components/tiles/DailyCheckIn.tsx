import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Card from "../ui/Card";

export default function DailyCheckin() {
  const { colors } = useTheme();
  const router = useRouter();

  const [isUserCheckedIn, setIsUserCheckedIn] = useState(false);

  if (!isUserCheckedIn)
    return (
      <Card
        style={{
          backgroundColor: "rgb(51, 51, 51)",
        }}
      >
        <TouchableOpacity
          onPress={() => {
            router.navigate("/modal");
            setIsUserCheckedIn(true);
          }}
          style={{
            height: 60,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            Complete Daily Check-in
          </Text>
        </TouchableOpacity>
      </Card>
    );

  return (
    <Card style={{ backgroundColor: "rgb(107, 145, 115)" }}>
      <View
        style={{
          height: 60,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <MaterialCommunityIcons name="check" color={colors.text} size={35} />
        <Text
          style={{
            color: colors.text,
            fontWeight: "bold",
            fontSize: 18,
            paddingTop: 5,
          }}
        >
          Checked-in!
        </Text>
      </View>
    </Card>
  );
}
