import { signOut } from "@/lib/auth";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Settings() {
  const { colors } = useTheme();

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
    signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <SettingsHeader />
      <SettingsDropdown
        options={accountabilityOptions}
        title="Accountability"
        defaultOption={{ label: "Medium", value: "medium" }}
      />
      <SettingsDropdown
        options={motivationOptions}
        title="Motivation Style"
        defaultOption={{ label: "Direct", value: "directly" }}
      />
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
        // justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold" }}>
        {title}
      </Text>

      <View style={{ display: "flex", flexDirection: "row" }}>
        {options.map((option) => (
          <SettingsDropdownOption
            label={option.label}
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
        <Text style={{ color: colors.text, textAlign: "center" }}>{label}</Text>
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
}: {
  label: string;
  onPress?: () => void;
  severity?: "normal" | "critical";
}) => {
  const { colors } = useTheme();
  return (
    <View
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 10,
      }}
    >
      <TouchableOpacity
        onPress={() => onPress()}
        style={{
          backgroundColor: severity === "critical" ? "rgb(195, 86, 86)" : "",
          width: "65%",
          padding: 15,
          borderWidth: 1,
          borderColor: "rgb(51,51,51)",
          borderRadius: 5,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: 16,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
