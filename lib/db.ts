import { supabase } from "./supabase";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createCheckIn(checkIn: {
  user_id: string;
  energy_level: number;
  soreness_level: number;
  motivation_level: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from("check_ins")
    .insert(checkIn)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getWorkouts(userId: string) {
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `
      *,
      exercises (*)
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}
