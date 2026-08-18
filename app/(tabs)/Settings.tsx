import { deleteAccount, signOut } from "@/lib/auth";
import { useProfile } from "@/lib/ProfileContext";
import {
  initializeRevenueCat,
  openCustomerCenter,
  syncRevenueCatUser,
} from "@/lib/revenuecat";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const router = useRouter();
  const { user } = useProfile();

  const handleSignOutPress = () => {
    signOut().then(() => {
      router.replace({
        pathname: "/(auth)/Login",
        params: { shouldShowIntro: "false" },
      });
    });
  };

  const handleDeleteAccountPress = () => {
    Alert.alert(
      "Delete your account?",
      "This action is permanent and will remove your account and saved data.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace({
                pathname: "/(auth)/Login",
                params: { shouldShowIntro: "false" },
              });
            } catch (error) {
              console.error("Failed to delete account:", error);
              Alert.alert(
                "Unable to delete account",
                "Please try again in a few moments.",
              );
            }
          },
        },
      ],
    );
  };

  const handleNoFeaturePress = () => {
    Alert.alert(
      "This feature is under development",
      "Please check back later.",
    );
  };

  const handleManageSubscriptionPress = async () => {
    if (!user?.id) {
      Alert.alert(
        "Not signed in",
        "Please sign in again before managing your subscription.",
      );
      return;
    }

    try {
      await initializeRevenueCat(user.id);
      await syncRevenueCatUser(user.id);
      await openCustomerCenter();
    } catch (error) {
      console.error("Failed to open Customer Center:", error);
      Alert.alert(
        "Unable to open subscription management",
        "Please try again in a few moments.",
      );
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: 10,
      }}
    >
      <SettingsButton
        label="Manage Subscription"
        onPress={handleManageSubscriptionPress}
      />
      <SettingsButton
        label="Create a New Goal"
        onPress={handleNoFeaturePress}
      />
      <SettingsButton label="Sign Out" onPress={handleSignOutPress} />
      <SettingsButton
        severity="critical"
        label="Delete Account"
        onPress={handleDeleteAccountPress}
      />
    </SafeAreaView>
  );
}

const SettingsButton = ({
  label,
  onPress = () => null,
  severity = "normal",
  disabled = false,
}: {
  label: string;
  onPress?: () => void;
  severity?: "normal" | "critical";
  disabled?: boolean;
}) => {
  const { colors } = useTheme();

  const handleDisabledPress = () => {
    Alert.alert(
      "Consistency is key to building lasting habits",
      "Stick to your current goal for atleast 30 days before creating a new one.",
    );
  };

  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 5,
      }}
    >
      <TouchableOpacity
        onPress={() => (disabled ? handleDisabledPress() : onPress())}
        style={{
          backgroundColor:
            severity === "critical" ? "rgb(195, 86, 86)" : "none",
          width: "100%",
          padding: 15,
          borderWidth: 1,
          borderColor: "rgb(51,51,51)",
          borderRadius: 5,
        }}
      >
        <Text
          style={{
            color: !disabled ? colors.text : "gray",
            fontSize: 16,
            letterSpacing: 1,
            textAlign: "center",
            fontWeight: 600,
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
