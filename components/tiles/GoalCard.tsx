import Card from "@/components/ui/Card";
import ProgressRing from "@/components/ui/ProgressRing";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function GoalCard({
  goal,
  completed = 0,
  total = 0,
  onEdit,
}: {
  goal?: string | null;
  completed?: number;
  total?: number;
  onEdit?: () => void;
}) {
  const progress = total === 0 ? 0 : Math.min(1, completed / total);

  return (
    <Card style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.goalText} numberOfLines={2} ellipsizeMode="tail">
          {goal ?? "Set a goal"}
        </Text>
      </View>

      <View style={styles.right}>
        <ProgressRing
          size={56}
          strokeWidth={6}
          progress={progress}
          color="#b89b5e"
          bgColor="#1A1D24"
          text={`${Math.round(progress * 100)}%`}
        />

        <TouchableOpacity
          style={styles.editBtn}
          onPress={onEdit}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="pencil" size={18} color="#b89b5e" />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    // backgroundColor: "#0F1720",
    borderColor: "#232833",
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  goalText: {
    color: "#F8F8FB",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  right: {
    width: "35%",
    alignItems: "center",
    gap: 15,
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  progressBox: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressValue: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  progressBar: {
    width: "100%",
    height: 6,
    borderRadius: 99,
    overflow: "hidden",
    backgroundColor: "#1A1D24",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#b89b5e",
  },
  editBtn: {
    marginTop: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(184,155,94,0.06)",
  },
});
