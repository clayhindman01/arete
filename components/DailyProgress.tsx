import { StyleSheet, Text, View } from "react-native";

type DailyProgressProps = {
  completed: number;
  total: number;
};

export default function DailyProgress({
  completed,
  total,
}: DailyProgressProps) {
  const progress = total === 0 ? 0 : completed / total;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Daily Progress</Text>
        <Text style={styles.value}>
          {completed}/{total}
        </Text>
      </View>

      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    padding: 5,
    paddingTop: 0,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  value: {
    color: "#71717A",
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: "600",
  },

  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#1A1D24",
    overflow: "hidden",
  },

  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#F5F5F5",
  },
});
