import { useTheme } from "@react-navigation/native";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Workout() {
  const theme = useTheme();

  return (
    <SafeAreaView>
      <Text style={{ color: theme.colors.text }}>Workout</Text>
    </SafeAreaView>
  );
}
