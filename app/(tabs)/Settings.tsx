import { signOut } from "@/lib/auth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { colors } = useTheme();
  const router = useRouter();

  const accountabilityOptions: Array<optionsType> = [
    {
      label: "Low",
      value: "low",
    },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ];

  const motivationOptions: Array<optionsType> = [
    { label: "Supportive", value: "supportive" },
    { label: "Direct", value: "directly" },
    { label: "Aggressive", value: "aggressive" },
  ];

  const handleSignOutPress = () => {
    signOut().then(() => {
      router.navigate("/(auth)/Login");
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#09090B" }}>
      <SettingsHeader />

      <SettingsButton label="Manage Subscription" />
      <SettingsButton label="Create a New Goal" disabled={true} />
      <SettingsButton label="Sign Out" onPress={handleSignOutPress} />
      <SettingsButton severity="critical" label="Delete Account" />
    </SafeAreaView>
  );
}

type optionsType = {
  label: string;
  value: string;
};

const SettingsDropdown = ({
  options,
  title,
  defaultOption,
}: {
  options: Array<optionsType>;
  title: string;
  defaultOption: optionsType;
}) => {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<optionsType>(defaultOption);
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: 10,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>

      <View style={{ display: "flex", flexDirection: "row" }}>
        {options.map((option, index) => (
          <SettingsDropdownOption
            label={option.label}
            key={index}
            selectedOption={selected}
          />
        ))}
      </View>
    </View>
  );
};

const SettingsDropdownOption = ({
  label,
  selectedOption,
}: {
  label: string;
  selectedOption: optionsType;
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ width: "33%", marginTop: 10 }}>
      <TouchableOpacity
        style={[
          {
            padding: 10,
          },
          selectedOption.label === label && {
            borderColor: "rgba(51, 51, 51)",
            borderWidth: 1,
            borderRadius: 5,
          },
        ]}
      >
        <Text
          style={{ color: colors.text, textAlign: "center", letterSpacing: 1 }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const SettingsHeader = () => {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View>
      <TouchableOpacity onPress={() => router.back()}>
        <MaterialCommunityIcons
          name="chevron-left"
          color={colors.text}
          size={40}
        />
      </TouchableOpacity>
    </View>
  );
};

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
        padding: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => (disabled ? handleDisabledPress() : onPress())}
        style={{
          backgroundColor:
            severity === "critical"
              ? "rgb(195, 86, 86)"
              : "rgba(148,163,184,0.3)",
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
