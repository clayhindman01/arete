import Button from "@/components/ui/Button";
import ButtonGroup from "@/components/ui/ButtonGroup";
import Loader from "@/components/ui/Loader";
import PlanComponent from "@/components/ui/PlanComponent";
import TextField from "@/components/ui/TextField";
import { generatePlan } from "@/lib/ai";
import { logEvent } from "@/lib/analytics";
import { completeOnboarding, saveGeneratedPlan } from "@/lib/db";
import { useProfile } from "@/lib/ProfileContext";
import type {
  AvailableTime,
  GoalTimeline,
  OnboardingData,
} from "@/types/onboarding";
import {
  AVAILABLE_TIME_OPTIONS,
  GOAL_TIMELINE_OPTIONS,
} from "@/types/onboarding";
import { Commitments, PlanGeneration } from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const router = useRouter();
  const { profile, refreshProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(2);
  const [planData, setPlanData] = useState<PlanGeneration>();
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    goal: "",
    goalTimeline: null,
    startingPoint: "",
    availableTime: null,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingData, string>>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<number, boolean[][]>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: typeof errors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
        }
        break;
      case 2:
        if (!formData.goal.trim()) {
          newErrors.goal = "Goal is required";
        }
        break;
      case 4:
        if (!formData.startingPoint.trim()) {
          newErrors.startingPoint = "Starting point is required";
        }
        break;
      case 3:
        break;
      case 5:
        break;
      case 6:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5 | 6);
      setErrors({});
    }
  };

  const handleSelectOption = (
    step: 1 | 2 | 3 | 4 | 5 | 6,
    nextFormData: OnboardingData = formData,
  ) => {
    if (validateStep(step)) {
      if (step < 5) {
        setCurrentStep((step + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        setErrors({});
      } else {
        handleGeneratePlan(nextFormData);
      }
    }
  };

  const handleGeneratePlan = async (data: OnboardingData = formData) => {
    setCurrentStep(6);
    console.log("Onboarding data:", data);

    const res = await generatePlan(data);
    const parsedPlan = JSON.parse(res.text);
    setPlanData(parsedPlan);
    console.log("Plan", parsedPlan);
    // non-blocking analytics
    void logEvent(
      "plan_generated",
      {
        goal_title: parsedPlan?.goal?.title ?? null,
      },
      profile?.id ?? null,
    );
  };

  const handleComplete = () => {
    if (!profile || !planData) return;

    // compute total selected tasks from selections (fallback to all selected)
    const totalSelectedTasks = planData.commitments.reduce((acc, c, ci) => {
      const selForCommitment = selections[ci];
      if (!selForCommitment) {
        return (
          acc +
          c.routines.reduce((a, r) => a + (r.tasks ? r.tasks.length : 0), 0)
        );
      }
      const count = selForCommitment.reduce(
        (ra, row) => ra + row.filter(Boolean).length,
        0,
      );
      return acc + count;
    }, 0);

    if (totalSelectedTasks === 0) {
      setSubmitError("Please select at least one task to create a plan");
      return;
    }

    setIsLoading(true);

    // Build filtered plan using selections
    const filteredPlan: PlanGeneration = {
      ...planData,
      commitments: planData.commitments
        .map((c, ci) => {
          const selForCommitment = selections[ci];
          if (!selForCommitment) return c;
          const routines = c.routines
            .map((r, ri) => {
              const taskSelectionRow =
                selForCommitment[ri] ?? r.tasks.map(() => true);
              const tasks = r.tasks.filter((t, ti) => taskSelectionRow[ti]);
              return { ...r, tasks };
            })
            .filter((r) => r.tasks && r.tasks.length > 0);
          return { ...c, routines } as Commitments;
        })
        .filter((c) => c.routines && c.routines.length > 0),
    };

    saveGeneratedPlan(profile.id, filteredPlan).then(() => {
      completeOnboarding().then(async () => {
        // non-blocking analytics
        void logEvent(
          "onboarding_completed",
          { plan_created: true },
          profile.id,
        );
        await refreshProfile();
        router.replace("/(paywall)");
      });
    });
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#09090B" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {currentStep != 6 && (
          <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />
        )}
        <ScrollView
          contentContainerStyle={styles.content}
          scrollEnabled={currentStep === 6}
        >
          {currentStep === 1 && (
            <View>
              <Text style={styles.stepTitle}>What should I call you?</Text>
              <TextField
                placeholder="Enter your name"
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                error={errors.name}
              />
            </View>
          )}

          {currentStep === 2 && (
            <View>
              <Text style={styles.stepTitle}>
                WHAT IS A GOAL YOU'D LIKE TO MAKE PROGRESS ON?
              </Text>
              <TextField
                placeholder="Describe your goal"
                value={formData.goal}
                onChangeText={(text) => {
                  setFormData({ ...formData, goal: text });
                  if (errors.goal) setErrors({ ...errors, goal: undefined });
                }}
                error={errors.goal}
              />
            </View>
          )}

          {currentStep === 3 && (
            <View>
              <Text style={styles.stepTitle}>
                IS THERE A TIMELINE FOR ACHIEVING YOUR GOAL?
              </Text>
              <ButtonGroup
                options={GOAL_TIMELINE_OPTIONS}
                value={formData.goalTimeline}
                onChange={(value: GoalTimeline) => {
                  const nextFormData = { ...formData, goalTimeline: value };
                  setFormData(nextFormData);
                  handleSelectOption(3, nextFormData);
                }}
              />
              {errors.goalTimeline && (
                <Text style={styles.errorText}>{errors.goalTimeline}</Text>
              )}
            </View>
          )}

          {currentStep === 4 && (
            <View>
              <Text style={styles.stepTitle}>
                DESCRIBE YOUR CURRENT PROGRESS ON THIS GOAL
              </Text>
              <Text style={styles.subText}>
                (The more details you include the more accurate your plan will
                be)
              </Text>
              <TextField
                placeholder="Describe your current situation"
                value={formData.startingPoint}
                onChangeText={(text) => {
                  setFormData({ ...formData, startingPoint: text });
                  if (errors.startingPoint)
                    setErrors({ ...errors, startingPoint: undefined });
                }}
                error={errors.startingPoint}
              />
            </View>
          )}

          {currentStep === 5 && (
            <View>
              <Text style={styles.stepTitle}>
                HOW MUCH TIME DAILY DO YOU HAVE AVAILABLE?
              </Text>
              <ButtonGroup
                options={AVAILABLE_TIME_OPTIONS}
                value={formData.availableTime}
                onChange={(value: AvailableTime) => {
                  const nextFormData = { ...formData, availableTime: value };
                  setFormData(nextFormData);
                  handleSelectOption(5, nextFormData);
                }}
              />
              {errors.availableTime && (
                <Text style={styles.errorText}>{errors.availableTime}</Text>
              )}
            </View>
          )}

          {currentStep === 6 &&
            (planData ? (
              <View>
                <Text style={styles.stepTitle}>EDIT PLAN</Text>
                {/* <Text style={styles.goalText}>{planData.goal.title}</Text> */}
                <Text style={styles.goalText}>
                  De-select tasks that you do not think would be benefitial to
                  help you reach your goal.
                </Text>
                <Text style={styles.subText}>
                  This is your plan, so make it work for you!
                </Text>
                {planData?.commitments.map((commitment, index) => (
                  <PlanComponent
                    key={index}
                    commitment={commitment}
                    commitmentIndex={index}
                    onChange={(ci, selection) => {
                      setSelections((prev) => ({ ...prev, [ci]: selection }));
                    }}
                  />
                ))}
              </View>
            ) : (
              <>
                <Text style={styles.stepTitle}>Creating Plan</Text>
                <ActivityIndicator size="large" color="white" />
              </>
            ))}

          {(currentStep === 1 || currentStep === 2 || currentStep === 4) && (
            <View style={styles.actions}>
              <Button label="Next" type="primary" onPress={handleNext} />
            </View>
          )}
          {currentStep === 6 && planData && (
            <View style={styles.actions}>
              {submitError && (
                <Text style={styles.errorText}>{submitError}</Text>
              )}
              <Button
                label="Create Plan"
                type="primary"
                onPress={() => {
                  setSubmitError(null);
                  handleComplete();
                }}
                disabled={
                  planData.commitments.reduce((acc, c, ci) => {
                    const selForCommitment = selections[ci];
                    if (!selForCommitment) {
                      return (
                        acc +
                        c.routines.reduce(
                          (a, r) => a + (r.tasks ? r.tasks.length : 0),
                          0,
                        )
                      );
                    }
                    const count = selForCommitment.reduce(
                      (ra, row) => ra + row.filter(Boolean).length,
                      0,
                    );
                    return acc + count;
                  }, 0) === 0
                }
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({
  currentStep,
  setCurrentStep,
}: {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  setCurrentStep: (value: 1 | 2 | 3 | 4 | 5 | 6) => void;
}) {
  const { colors } = useTheme();
  const handleBack = () => {
    setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6);
  };
  return (
    <View style={styles.header}>
      {currentStep != 2 && (
        <TouchableOpacity
          onPress={handleBack}
          style={{ position: "absolute", left: 0, paddingTop: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            color={colors.text}
            size={50}
          />
        </TouchableOpacity>
      )}

      <View style={styles.progressChunkContainer}>
        <ProgressChunk completed={currentStep >= 2} />
        <ProgressChunk completed={currentStep >= 3} />
        <ProgressChunk completed={currentStep >= 4} />
        <ProgressChunk completed={currentStep >= 5} />
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
  card: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  goalText: {
    fontSize: 16,
    textAlign: "center",
    color: "#ecedee",
    fontWeight: "600",
    marginTop: -18,
    marginBottom: 24,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
    marginTop: -18,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
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
  header: {
    flexDirection: "row",
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
