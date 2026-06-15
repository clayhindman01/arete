import { PlanGeneration } from "@/types/PlanGeneration";
import { supabase } from "./supabase";

export async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").single();

  if (error) {
    throw error;
  }

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

export const completeOnboarding = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to complete onboarding:", error);
  }
};

export async function getPlans(userId: string) {
  const { data, error } = await supabase
    .from("ai_plans")
    .select(
      `
      *,
    `,
    )
    .eq("user_id", userId);

  if (error) throw error;
  return data;
}

export async function saveGeneratedPlan(userId: string, plan: PlanGeneration) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("user.id", user?.id);
  console.log("saveGeneratedPlan user_id", userId);
  // Get next version number
  const { data: latestPlan } = await supabase
    .from("ai_plans")
    .select("version")
    .eq("user_id", userId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestPlan?.version ?? 0) + 1;

  // Deactivate existing plans
  await supabase
    .from("ai_plans")
    .update({ active: false })
    .eq("user_id", userId);

  // Create plan record
  const { data: planRow, error: planError } = await supabase
    .from("ai_plans")
    .insert({
      user_id: userId,
      version: nextVersion,
      goal: plan.goal.title,
      summary: plan.goal.description,
      plan_json: plan,
      active: true,
    })
    .select()
    .single();

  if (planError) throw planError;

  const planId = planRow.id;

  // Create commitments and routines
  for (const commitment of plan.commitments) {
    const { data: commitmentRow, error: commitmentError } = await supabase
      .from("commitments")
      .insert({
        user_id: userId,
        plan_id: planId,
        title: commitment.title,
        description: commitment.description,
        goal_title: plan.goal.title,
        status: "active",
        due_date: plan.goal.target_date,
      })
      .select()
      .single();

    if (commitmentError) throw commitmentError;

    for (const routine of commitment.routines) {
      const { data: routineRow, error: routineError } = await supabase
        .from("routines")
        .insert({
          user_id: userId,
          plan_id: planId,
          title: routine.title,
          frequency: routine.frequency,
          active: true,
        })
        .select()
        .single();

      if (routineError) throw routineError;

      const steps = routine.tasks.map((task, index) => ({
        routine_id: routineRow.id,
        title: task.title,
        description: task.description,
        estimated_minutes: task.estimated_minutes,
        order_index: index,
      }));

      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from("routine_steps")
          .insert(steps);

        if (stepsError) throw stepsError;
      }
    }
  }

  return planRow;
}
