import {
  Commitments,
  PlanGeneration,
  Routines,
  Tasks,
} from "@/types/PlanGeneration";
import { supabase } from "./supabase";

export async function getProfile() {
  const { data, error } = await supabase.from("profiles").select("*").single();

  if (error) {
    throw error;
  }

  return data;
}

const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");
  return user;
};

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
  const user = await getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to complete onboarding:", error);
  }
};

export async function getActivePlan() {
  const user = await getUser();
  const { data, error } = await supabase
    .from("ai_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .single();

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
          days_of_week: routine.days_of_week,
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
        one_word_description: task.one_word_description,
      }));

      if (steps.length > 0) {
        const { error: stepsError } = await supabase
          .from("tasks")
          .insert(steps);

        if (stepsError) throw stepsError;
      }
    }
  }

  return planRow;
}

const DAY_MAP = ["Su", "M", "T", "W", "Th", "F", "S"] as const;

function getToday() {
  return DAY_MAP[new Date().getDay()];
}

type LatentTask = Tasks & {
  commitment_title: string;
  routine_title: string;
  allowed_days: ("M" | "T" | "W" | "Th" | "F" | "S" | "Su")[];
  frequency: "daily" | "weekly";
};

export async function createOrUpdateLatentPlan(planJson: any) {
  const user = await getUser();
  const today = new Date().toISOString().split("T")[0];

  // 1. Build latent weekly pool
  const weeklyTaskPool = planJson.commitments.flatMap(
    (commitment: Commitments) =>
      commitment.routines.flatMap((routine: Routines) =>
        routine.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          estimated_minutes: task.estimated_minutes,
          one_word_description: task.one_word_description,

          commitment_title: commitment.title,
          routine_title: routine.title,
          frequency: routine.frequency,
          allowed_days: routine.days_of_week,
        })),
      ),
  );

  // 2. Upsert into user_latent_plans (ONLY ONCE PER DAY)
  const { data, error } = await supabase
    .from("user_latent_plans")
    .upsert(
      {
        user_id: user.id,
        generated_for_date: today,
        weekly_task_pool: weeklyTaskPool,
      },
      {
        onConflict: "user_id,generated_for_date",
      },
    )
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getOrCreatePreCheckinDailyPlan(
  weeklyTaskPool: LatentTask[],
) {
  const today = getToday();
  const user = await getUser();

  const { data: existingPlan } = await supabase
    .from("daily_plans")
    .select(
      `
    id,
    user_id,
    is_current,
    ai_summary,
    created_at,
    daily_tasks (
      id,
      title,
      description,
      estimated_minutes,
      sort_order,
      completed,
      completed_at
    )
  `,
    )
    .eq("user_id", user.id)
    .eq("is_current", true)
    .maybeSingle();

  if (existingPlan && existingPlan.daily_tasks) {
    return existingPlan.daily_tasks;
  }

  // 1. Filter tasks for today from latent pool
  const eligibleTasks = weeklyTaskPool.filter((task) =>
    task.allowed_days.includes(today),
  );

  // 2. Build draft task set (no AI yet)
  const selectedTasks = eligibleTasks.slice(0, 6).map((task, index) => ({
    title: task.title,
    description: task.description,
    estimated_minutes: task.estimated_minutes,
    sort_order: index,
  }));

  // 3. Close any existing active plan (draft or previous)
  await supabase
    .from("daily_plans")
    .update({ is_current: false })
    .eq("user_id", user.id)
    .eq("is_current", true);

  // 4. Create NEW draft daily plan (pre-check-in state)
  const { data: plan, error: planError } = await supabase
    .from("daily_plans")
    .insert({
      user_id: user.id,
      is_current: true,
      ai_summary: "Draft plan generated from latent pool (pre check-in)",
    })
    .select()
    .single();

  if (planError) throw planError;

  // 5. Insert draft tasks
  const { data: tasks, error: taskError } = await supabase
    .from("daily_tasks")
    .insert(
      selectedTasks.map((t) => ({
        ...t,
        plan_id: plan.id,
      })),
    );

  if (taskError) throw taskError;

  return tasks;
}

export async function completeTask(taskId: string) {
  const user = await getUser();

  if (!user?.id) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("daily_tasks")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw error;

  return data;
}
