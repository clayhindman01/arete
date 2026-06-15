type Goal = {
  description: string;
  target_date: string;
  title: string;
};

export type Tasks = {
  title: string;
  description: string;
  estimated_minutes: number;
};

export type DaysOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
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
