import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type ButtonGroupOption<T> = {
  label: string;
  value: T;
};

type ButtonGroupProps<T> = {
  options: ButtonGroupOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
};

export default function ButtonGroup<T>({
  options,
  value,
  onChange,
}: ButtonGroupProps<T>) {
  return (
    <View style={styles.container}>
      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      > */}
      <View style={styles.buttonContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={String(option.value)}
            style={[
              styles.button,
              value === option.value
                ? styles.buttonSelected
                : styles.buttonUnselected,
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text
              style={[
                styles.buttonText,
                value === option.value
                  ? styles.buttonTextSelected
                  : styles.buttonTextUnselected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* </ScrollView> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollView: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    // flexDirection: "row",
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 28,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  buttonSelected: {
    backgroundColor: "rgb(103, 189, 122)",
    borderColor: "rgb(103, 189, 122)",
  },
  buttonUnselected: {
    backgroundColor: "transparent",
    borderColor: "rgba(148,163,184,0.3)",
  },
  buttonText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
  buttonTextSelected: {
    color: "#fff",
  },
  buttonTextUnselected: {
    color: "#e2e8f0",
  },
});
