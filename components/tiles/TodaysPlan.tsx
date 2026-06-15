import { PlanGeneration } from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "../ui/Card";

export default function TodaysPlan({
  plan_json,
}: {
  plan_json: PlanGeneration;
}) {
  const { colors } = useTheme();

  return (
    <Card>
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>
          Today's Plan
        </Text>
      </View>
      {plan_json &&
        plan_json.commitments.map((commitment, index) => (
          <View key={index}>
            {commitment.routines.map((routine, i) => (
              <View key={`${index}${i}`}>
                {routine.tasks.map((task, j) => (
                  <View key={`${index}${i}${j}`}>
                    <CheckListItem
                      title={`${task.title}`}
                      grayOnCheck={false}
                      isLastElement={
                        index === plan_json.commitments.length - 1 &&
                        i === commitment.routines.length - 1 &&
                        j === routine.tasks.length - 1
                      }
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
    </Card>
  );
}

export const CheckListItem = ({
  title,
  isLastElement = false,
  defaultChecked = false,
  grayOnCheck = true,
}: {
  title: string;
  isLastElement?: boolean;
  defaultChecked?: boolean;
  grayOnCheck?: boolean;
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
          <MaterialCommunityIcons name="check" color={colors.text} size={10} />
        )}
      </View>
      {/* bottom line */}
      {!isLastElement && <View style={styles.bottomLine} />}
      <Text
        style={{
          fontSize: 16,
          color: isChecked
            ? grayOnCheck
              ? "gray"
              : colors.text
            : !grayOnCheck
              ? colors.text
              : "gray",
          paddingLeft: 20,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  checkListItem: {
    padding: 5,
    display: "flex",
    flexDirection: "row",
  },
  circle: {
    borderRadius: 100,
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: "lightgray",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  incomplete: {
    borderWidth: 1,
    borderColor: "lightgray",
  },
  complete: {
    backgroundColor: "rgb(103, 189, 122)",
  },
  bottomLine: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "lightgray",
    position: "relative",
    right: 10,
    top: 20,
    height: 10,
  },
});
