import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function TodaysPlan({ tasks }: { tasks: any }) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          TODAY'S TASKS
        </Text>

        <Text style={[styles.titleSubText]}>{tasks.length} remaining</Text>
      </View>
      {tasks.map((task: any, index: number) => (
        <View key={index}>
          <CheckListItem title={`${task.taskTitle}`} grayOnCheck={false} />
        </View>
      ))}
    </Card>
  );
}

export const CheckListItem = ({
  title,
  defaultChecked = false,
  grayOnCheck = true,
  children,
}: {
  title?: string;
  defaultChecked?: boolean;
  grayOnCheck?: boolean;
  children?: React.ReactNode;
}) => {
  const { colors } = useTheme();
  const [isChecked, setIsChecked] = useState(defaultChecked);
  return (
    <Pressable
      onPress={() => setIsChecked(!isChecked)}
      style={styles.checkListItem}
    >
      <View
        style={[styles.circle, isChecked ? styles.complete : styles.incomplete]}
      >
        {isChecked && (
          <MaterialCommunityIcons name="check" color="black" size={14} />
        )}
      </View>
      <View style={{ paddingLeft: 10 }}>
        {title && (
          <Text
            style={{
              fontSize: 14,
              color: isChecked ? "#A1A1AA" : colors.text,
              textDecorationLine: isChecked ? "line-through" : "none",
              letterSpacing: 0.5,
            }}
          >
            {title}
          </Text>
        )}
        {children}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 14,
    color: "#F5F5F5",
    fontWeight: 600,
    letterSpacing: 1,
  },
  titleSubText: {
    fontSize: 12,
    color: "#A1A1AA",
    fontWeight: 600,
  },
  checkListItem: {
    padding: 5,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    borderRadius: 100,
    height: 20,
    width: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  incomplete: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
  },
  complete: {
    backgroundColor: "#A1A1AA",
  },
});
