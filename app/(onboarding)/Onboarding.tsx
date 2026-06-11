import { useProfile } from "@/app/(auth)/ProfileContext";
import Button from "@/components/ui/Button";
import ButtonGroup from "@/components/ui/ButtonGroup";
import PlanComponent from "@/components/ui/PlanComponent";
import PulseText from "@/components/ui/PulseText";
import TextField from "@/components/ui/TextField";
import { generatePlan } from "@/lib/ai";
import type {
  AvailableTime,
  GoalTimeline,
  OnboardingData,
} from "@/types/onboarding";
import {
  AVAILABLE_TIME_OPTIONS,
  GOAL_TIMELINE_OPTIONS,
} from "@/types/onboarding";
import { PlanGeneration } from "@/types/PlanGeneration";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const router = useRouter();
  const { profile, refreshProfile } = useProfile();
  const [showIntro, setShowIntro] = useState(true);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
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
    console.log(currentStep);
    if (validateStep(currentStep)) {
      if (currentStep < 6) {
        setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        setErrors({});
      } else {
        handleComplete();
      }
    }
  };

  const handleSelectOption = (step: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (validateStep(step)) {
      if (step < 5) {
        setCurrentStep((step + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        setErrors({});
      } else {
        handleGeneratePlan();
      }
    }
  };

  const handleGeneratePlan = async () => {
    setCurrentStep(6);
    // TODO: Save formData to database when ready
    // For now, just mark onboarding as complete
    console.log("Onboarding data:", formData);
    generatePlan(formData).then((res) => {
      setPlanData(JSON.parse(res.text));
      console.log("Plan", JSON.parse(res.text));
    });

    // Mark onboarding as complete and navigate
  };

  const handleComplete = () => {
    if (profile) {
      // Update profile to mark onboarding complete
      // completeOnboarding().then(async () => await refreshProfile());
    }
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#020617" }]}>
      {showIntro ? (
        <PulseText onAnimationComplete={() => setShowIntro(false)} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.content}>
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
                <Text style={styles.stepTitle}>What's your goal?</Text>
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
                <Text style={styles.stepTitle}>Timeline for your goal?</Text>
                <ButtonGroup
                  options={GOAL_TIMELINE_OPTIONS}
                  value={formData.goalTimeline}
                  onChange={(value: GoalTimeline) => {
                    setFormData({ ...formData, goalTimeline: value });
                    handleSelectOption(3);
                  }}
                />
                {errors.goalTimeline && (
                  <Text style={styles.errorText}>{errors.goalTimeline}</Text>
                )}
              </View>
            )}

            {currentStep === 4 && (
              <View>
                <Text style={styles.stepTitle}>Where are you starting?</Text>
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
                  How much time daily can you commit?
                </Text>
                <ButtonGroup
                  options={AVAILABLE_TIME_OPTIONS}
                  value={formData.availableTime}
                  onChange={(value: AvailableTime) => {
                    setFormData({ ...formData, availableTime: value });
                    handleSelectOption(5);
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
                  <Text style={styles.stepTitle}>
                    Modify the plan to fit your life
                  </Text>
                  {planData?.commitments.map((commitment, index) => (
                    <PlanComponent key={index} commitment={commitment} />
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
                <Button
                  label={currentStep === 6 ? "Complete" : "Next"}
                  type="primary"
                  onPress={handleNext}
                />
                {/* {currentStep === 6 && (
                  <Button type="secondary" label="Customize Plan" />
                )} */}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
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
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  subText: {
    fontSize: 18,
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
});
