export type CheckIn = {
  id: string;
  user_id: string;
  created_at: string;
  energy_level: number | null;
  difficulty_rating: string | null;
  difficulty_note: string | null;
  notes: string | null;
  available_time: string | null;
};
