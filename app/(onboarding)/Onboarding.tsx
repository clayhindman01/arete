import OnboardingOption from "@/components/OnboardingOption";
import { Button } from "@react-navigation/elements";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [state, setState] = useState({
    fitness_goal: "",
    age: "",
    current_weight: "",
  });

  const onboardingSteps = [
    {
      step: 1,
      key: "fitness_goal",
      options: ["Lose Weight", "Build Muscle", "Both"],
    },
    {
      step: 2,
      key: "age",
      value: "",
    },
  ];

  let step = onboardingSteps[currentStep];

  useEffect(() => {
    step = onboardingSteps[currentStep];
  }, [setCurrentStep]);

  return (
    <SafeAreaView>
      {step.options?.map((item, index) => (
        <OnboardingOption handlePress={() => console.log("test")}>
          <Text>{item}</Text>
        </OnboardingOption>
      ))}
      <Button style={{ backgroundColor: colors.border }} color={colors.text}>
        Text
      </Button>
    </SafeAreaView>
  );
}
