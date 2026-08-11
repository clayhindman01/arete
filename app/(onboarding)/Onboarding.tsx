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
    if (profile && planData) {
      setIsLoading(true);
      // Update profile to mark onboarding complete
      saveGeneratedPlan(profile.id, planData).then(() => {
        completeOnboarding().then(async () => {
          // non-blocking analytics
          void logEvent(
            "onboarding_completed",
            { plan_created: true },
            profile.id,
          );
          await refreshProfile();
          router.replace("/(tabs)");
          router.push({
            pathname: "/(tabs)",
            params: { shouldShowIntro: "false" },
          });
        });
      });
    }
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#09090B" }]}>
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
              <Text style={styles.stepTitle}>WHAT IS YOUR GOAL?</Text>
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
                WHEN DO YOU WANT TO ACHIEVE YOUR GOAL?
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
              <Text style={styles.stepTitle}>WHERE ARE YOU STARTING AT?</Text>
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
                <Text style={styles.stepTitle}>ARETE'S PLAN</Text>
                <Text style={styles.goalText}>{planData.goal.title}</Text>
                <Text style={styles.subText}>{planData.goal.description}</Text>
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
                label="Create Plan"
                type="primary"
                onPress={handleComplete}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
});
