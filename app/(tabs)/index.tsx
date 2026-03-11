import { getCurrentUser } from "@/lib/auth";
import { useTheme } from "@react-navigation/native";
import { Redirect } from "expo-router";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const { colors } = useTheme();

  if (getCurrentUser != null) {
    return (
      <SafeAreaView>
        <Text style={{ color: colors.text }}>Dashboard</Text>
      </SafeAreaView>
    );
  } else {
    return <Redirect href="/(auth)/Login" />;
  }
}
