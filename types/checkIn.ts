export type CheckIn = {
  id: string;
  user_id: string;
  created_at: string;
  energy_level: number | null;
  soreness_level: number | null;
  motivation_level: number | null;
  notes: string | null;
};
