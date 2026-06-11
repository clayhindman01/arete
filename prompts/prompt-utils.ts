import { OnboardingData } from "@/types/onboarding";

export const buildUserPlanPrompt = (input: OnboardingData) => {
  return `Generate an Arete plan for this user.

    Name:
    ${input.name}

    Primary Goal:
    ${input.goal}

    Goal Deadline:
    ${input.goalTimeline}

    Starting Point:
    ${input.startingPoint}

    Available Time daily:
    ${input.availableTime}

    Create a plan that maximizes the likelihood of success while keeping the workload sustainable.`;
};
