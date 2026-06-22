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
    <View style={[styles.container, { backgroundColor: "#111318" }, style]}>
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
    borderColor: "#232833",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 4,
    // background: "linear-gradient(180deg,rgba(20, 23, 31, 0.95) 0%,rgba(13, 15, 20, 0.95) 100%)",
  },
});
