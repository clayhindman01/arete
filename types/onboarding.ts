export type GoalTimeline =
  | "none"
  | "30days"
  | "90days"
  | "6months"
  | "1year"
  | "moreThan1year";
export type AvailableTime =
  | "lessThan15"
  | "15to30"
  | "30to60"
  | "1to2hours"
  | "2plus";

export interface OnboardingData {
  name: string;
  goal: string;
  goalTimeline: GoalTimeline | null;
  startingPoint: string;
  availableTime: AvailableTime | null;
}

export const GOAL_TIMELINE_OPTIONS = [
  { label: "No timeline", value: "none" as GoalTimeline },
  { label: "30 days", value: "30days" as GoalTimeline },
  { label: "90 days", value: "90days" as GoalTimeline },
  { label: "6 months", value: "6months" as GoalTimeline },
  { label: "1 year", value: "1year" as GoalTimeline },
  { label: "More than 1 year", value: "moreThan1year" as GoalTimeline },
];

export const AVAILABLE_TIME_OPTIONS = [
  { label: ">15 min", value: "lessThan15" as AvailableTime },
  { label: "15-30 min", value: "15to30" as AvailableTime },
  { label: "30-60 min", value: "30to60" as AvailableTime },
  { label: "1-2 hours", value: "1to2hours" as AvailableTime },
  { label: "2+ hours", value: "2plus" as AvailableTime },
];
