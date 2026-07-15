import Button from "@/components/ui/Button";
import ButtonGroup from "@/components/ui/ButtonGroup";
import TextField from "@/components/ui/TextField";
import { generateAdaptiveDailyPlan } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { createDailyCheckIn, saveAdaptiveDailyPlan } from "@/lib/db";
import { AVAILABLE_TIME_OPTIONS, AvailableTime } from "@/types/onboarding";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StepType = 1 | 2 | 3 | 4;
type YesterdayDifficulty =
  | "very-easy"
  | "easy"
  | "about-right"
  | "difficult"
  | "very-difficult";
type EnergyScale = 1 | 2 | 3 | 4 | 5;

const YESTERDAY_DIFFICULTY_OPTIONS = [
  { label: "Very Easy", value: "very-easy" as YesterdayDifficulty },
  { label: "Easy", value: "easy" as YesterdayDifficulty },
  { label: "About Right", value: "about-right" as YesterdayDifficulty },
  { label: "Difficult", value: "difficult" as YesterdayDifficulty },
  { label: "Very Difficult", value: "very-difficult" as YesterdayDifficulty },
];

const ENERGY_SCALE = [
  { label: "Running on empty", value: 1 as EnergyScale },
  { label: "Low energy", value: 2 as EnergyScale },
  { label: "Normal", value: 3 as EnergyScale },
  { label: "High energy", value: 4 as EnergyScale },
  { label: "High on life", value: 5 as EnergyScale },
];

export interface CheckInValue {
  yesterdayDifficulty: YesterdayDifficulty | null;
  energyScale: EnergyScale | null;
  availableTime: AvailableTime | null;
  todaysImpediments: string;
}

export default function CheckIn() {
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const params = useLocalSearchParams();
  const [checkInValue, setCheckInValue] = useState<CheckInValue>({
    yesterdayDifficulty: null,
    energyScale: null,
    availableTime: null,
    todaysImpediments: "",
  });


  console.log("todaysTasks in CheckIn.tsx", params.todaysTasks);
  const router = useRouter();

  async function submitCheckIn(checkIn: any){
    await createDailyCheckIn(checkIn);

    const user = await getCurrentUser();

    generateAdaptiveDailyPlan({
      tasks: JSON.parse(params.todaysTasks as string),
      checkIn,
    }).then(async (res) => {
      console.log("Adaptive Plan:", JSON.parse(res.text));
      await saveAdaptiveDailyPlan(
        JSON.parse(res.text),
        user.id
      );
    }).then(() => {
      setCurrentStep(1);
      router.back();
    })
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#09090B" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <CheckInHeader
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
        <View style={styles.content}>
          {currentStep === 1 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How did yesterday's plan feel?
              </Text>

              <ButtonGroup
                options={YESTERDAY_DIFFICULTY_OPTIONS}
                value={checkInValue?.yesterdayDifficulty}
                onChange={(value: YesterdayDifficulty) => {
                  setCheckInValue({
                    ...checkInValue,
                    yesterdayDifficulty: value,
                  });
                  setCurrentStep(2);
                }}
              />
            </View>
          )}
          {currentStep === 2 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How much energy do you have today?
              </Text>

              <ButtonGroup
                options={ENERGY_SCALE}
                value={checkInValue?.energyScale}
                onChange={(value: EnergyScale) => {
                  setCheckInValue({
                    ...checkInValue,
                    energyScale: value,
                  });
                  setCurrentStep(3);
                }}
              />
            </View>
          )}
          {currentStep === 3 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How much time do you realistically have today?
              </Text>

              <ButtonGroup
                options={AVAILABLE_TIME_OPTIONS}
                value={checkInValue?.availableTime}
                onChange={(value: AvailableTime) => {
                  setCheckInValue({
                    ...checkInValue,
                    availableTime: value,
                  });
                  setCurrentStep(4);
                }}
              />
            </View>
          )}
          {currentStep === 4 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                Is there anything that might affect your progress today?
                (optional)
              </Text>

              <TextField
                placeholder="Eg: sickness, travel, appointments"
                value={checkInValue.todaysImpediments}
                onChangeText={(text) => {
                  setCheckInValue({ ...checkInValue, todaysImpediments: text });
                }}
              />
              <View style={styles.actions}>
                <Button
                  label="Complete Check-in"
                  type="primary"
                  onPress={() => submitCheckIn(checkInValue)}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckInHeader({
  currentStep,
  setCurrentStep,
}: {
  currentStep: StepType;
  setCurrentStep: (value: StepType) => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const handleBack = () => {
    setCurrentStep(1);
    router.back();
  };
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack}>
        <MaterialCommunityIcons
          name="chevron-left"
          color={colors.text}
          size={40}
        />
      </TouchableOpacity>

      <View style={styles.progressChunkContainer}>
        <ProgressChunk completed={currentStep >= 1} />
        <ProgressChunk completed={currentStep >= 2} />
        <ProgressChunk completed={currentStep >= 3} />
        <ProgressChunk completed={currentStep >= 4} />
      </View>
    </View>
  );
}

function ProgressChunk({ completed = false }: { completed?: boolean }) {
  return (
    <View style={[styles.progressChunk, completed && styles.completed]}></View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressChunk: {
    height: 5,
    width: "20%",
    borderRadius: 10,
    backgroundColor: "#A1A1AA",
  },
  completed: {
    backgroundColor: "#F5F5F5",
  },
  progressChunkContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  buttonGap: {
    gap: 10,
  },
  actions: {
    marginTop: 24,
  },
});
