export type Exercise = {
  id: string;
  workout_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  order_index: number | null;
};
