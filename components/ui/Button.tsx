import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type ButtonProps = {
  label: string;
  type: "primary" | "secondary";
  children?: ReactNode;
  onPress?: () => void;
};

export default function Button({
  label,
  type,
  children,
  onPress = () => null,
}: ButtonProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={type === "primary" ? styles.primaryButton : styles.secondaryButton}
      onPress={onPress}
    >
      <Text
        style={
          type === "primary"
            ? styles.primaryButtonText
            : styles.secondaryButtonText
        }
      >
        {label}
      </Text>
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: "#e2e8f0",
  },
});
