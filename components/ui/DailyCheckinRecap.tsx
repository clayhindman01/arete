import { getCheckinData } from "@/lib/db";
import { CheckIn } from "@/types/checkIn";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import InsightsTile from "../tiles/InsightsTile";

export default function DailyCheckinRecap({
  aiSummary,
}: {
  aiSummary: string;
}) {
  const [checkinData, setCheckinData] = useState<CheckIn>();

  useEffect(() => {
    getCheckinData().then((res) => {
      setCheckinData(res);
      console.log("checkin dtat", res);
    });
  }, []);

  const yesterdaysDifficultyMap = new Map([
    ["very-easy", "Very Easy"],
    ["easy", "Easy"],
    ["about-right", "About Right"],
    ["difficult", "Difficult"],
    ["very-difficult", "Very Difficult"],
  ]);

  const energyMap = new Map([
    [1, "Running on Empty"],
    [2, "Low energy"],
    [3, "Normal"],
    [4, "High energy"],
    [5, "High on life"],
  ]);

  const timeMap = new Map([
    ["lessThan15", ">15 min"],
    ["15to30", "15-30 min"],
    ["30to60", "30-60 min"],
    ["1to2hours", "1-2 hours"],
    ["2plus", "2+ hours"],
  ]);

  const energyText =
    typeof checkinData?.energy_level === "number"
      ? energyMap.get(checkinData.energy_level)
      : undefined;

  return (
    // removing the padding from the menu modal and re-adding it back inside so that the scollbar is on the edge of the screen
    <ScrollView
      style={{
        marginHorizontal: -18,
        paddingHorizontal: 18,
        marginBottom: -24,
        paddingBottom: 10,
      }}
    >
      <InsightsTile aiSummary={aiSummary} />

      <View style={styles.buttonGap}>
        <Text style={styles.stepTitle}>How did yesterday's plan feel?</Text>

        <View style={[styles.button, styles.buttonSelected]}>
          <Text style={[styles.buttonText, styles.buttonTextUnselected]}>
            {yesterdaysDifficultyMap.get(checkinData?.difficulty_rating ?? "")}
          </Text>
        </View>
      </View>

      <View style={styles.buttonGap}>
        <Text style={styles.stepTitle}>How much energy do you have today?</Text>

        <View style={[styles.button, styles.buttonSelected]}>
          <Text style={[styles.buttonText, styles.buttonTextUnselected]}>
            {energyText}
          </Text>
        </View>
      </View>

      <View style={styles.buttonGap}>
        <Text style={styles.stepTitle}>
          How much time do you realistically have today?
        </Text>

        <View style={[styles.button, styles.buttonSelected]}>
          <Text style={[styles.buttonText, styles.buttonTextUnselected]}>
            {timeMap.get(checkinData?.available_time ?? "")}
          </Text>
        </View>
      </View>

      <View style={styles.buttonGap}>
        <Text style={styles.stepTitle}>
          Is there anything that might affect your progress today?
        </Text>

        <View style={[styles.button, styles.buttonSelected]}>
          <Text style={[styles.buttonText, styles.buttonTextUnselected]}>
            {checkinData?.notes ? checkinData.notes : "None"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stepTitle: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  buttonGap: {
    paddingVertical: 10,
  },
  button: {
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  buttonUnselected: {
    backgroundColor: "transparent",
    borderColor: "rgba(148,163,184,0.3)",
  },
  buttonSelected: {
    backgroundColor: "#b89b5e",
    borderColor: "#b89b5e",
  },
  buttonText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: 500,
    letterSpacing: 1,
  },
  buttonTextUnselected: {
    color: "#e2e8f0",
  },
});
