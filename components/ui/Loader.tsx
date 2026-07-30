import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type LoaderProps = {
  size?: "small" | "large" | number;
  color?: string;
  text?: string;
  fullScreen?: boolean;
  style?: object;
};

export default function Loader({
  size = "large",
  color = "#A1A1AA",
  text,
  fullScreen = false,
  style,
}: LoaderProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={color} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  fullScreen: {
    flex: 1,
    minHeight: 220,
    backgroundColor: "rgba(10, 12, 18, 0.55)",
  },
  text: {
    marginTop: 8,
    color: "#f4f7fb",
    fontSize: 14,
    fontWeight: "500",
  },
});
