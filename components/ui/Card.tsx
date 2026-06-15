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
    <View style={[styles.container, { backgroundColor: "#1e1e2d" }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(85, 84, 84, 0.5)",
  },
});
