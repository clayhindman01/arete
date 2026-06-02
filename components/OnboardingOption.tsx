import { TouchableOpacity } from "react-native";

type OnBoardingOptionProps = {
  children: any;
  handlePress: () => void;
};

export default function OnboardingOption({
  children,
  handlePress,
}: OnBoardingOptionProps) {
  return <TouchableOpacity onPress={handlePress}>{children}</TouchableOpacity>;
}
