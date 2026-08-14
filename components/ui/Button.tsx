import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

type ButtonProps = {
  label: string;
  type: "primary" | "secondary";
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
};

export default function Button({
  label,
  type,
  children,
  onPress = () => null,
  disabled = false,
}: ButtonProps) {
  const router = useRouter();
  const handlePress = () => {
    if (disabled) return;
    onPress && onPress();
  };

  return (
    <TouchableOpacity
      style={
        disabled
          ? styles.disabledButton
          : type === "primary"
          ? styles.primaryButton
          : styles.secondaryButton
      }
      onPress={handlePress}
      disabled={disabled}
    >
      <Text
        style={
          disabled
            ? styles.disabledButtonText
            : type === "primary"
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
    backgroundColor: "#b89b5e",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 25,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 25,
  },
  disabledButton: {
    backgroundColor: "#6b6b6b",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    opacity: 0.7,
  },
  disabledButtonText: {
    color: "#d1d1d1",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 1,
    lineHeight: 25,
  },
});
