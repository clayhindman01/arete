export type Goal = {
  description: string;
  target_date: string;
  title: string;
};

export type Tasks = {
  title: string;
  description: string;
  estimated_minutes: number;
  one_word_description: string;
};

export type DaysOfWeek = "Su" | "M" | "T" | "W" | "Th" | "F" | "S";
export type Routines = {
  title: string;
  frequency: "daily" | "weekly";
  days_of_week: DaysOfWeek[];
  tasks: Tasks[];
};

export type Commitments = {
  description: string;
  routines: Routines[];
  title: string;
};

export type PlanGeneration = {
  goal: Goal;
  commitments: Commitments[];
};
