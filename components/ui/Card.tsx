import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

export default function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: "rgba(26, 26, 26, 0.75)" },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(85, 84, 84, 0.5)",
  },
});
