import { ARETE_SYSTEM_PROMPT } from "@/prompts/arete-system-prompt";
import { ADAPTIVE_PLAN_SYSTEM_PROMPT } from "@/prompts/daily-checkin-plan-adaption";
import { buildUserPlanPrompt } from "@/prompts/prompt-utils";
import { OnboardingData } from "@/types/onboarding";
import { supabase } from "./supabase";

export async function generatePlan(input: OnboardingData) {
  try {
    return callModelWithRetry(
      async () => {
        try {
          const { data, error } = await supabase.functions.invoke(
            "generate-ai",
            {
              body: {
                prompt: buildUserPlanPrompt(input),
                systemInstruction: ARETE_SYSTEM_PROMPT,
              },
            },
          );

          if (error) {
            throw error;
          }

          return data;
        } catch (err: any) {
          const resp =
            err?.response || err?.context || err?.cause?.response || null;
          if (resp && typeof resp.json === "function") {
            try {
              const payload = await resp.json();
              throw new Error(
                `Edge function error: ${JSON.stringify(payload)}`,
              );
            } catch {
              try {
                const text = await resp.text();
                throw new Error(`Edge function error: ${text}`);
              } catch {
                // fallthrough to original error
              }
            }
          }

          throw err;
        }
      },

      // const response = data.text;
      //   }
      //     ai.models.generateContent({
      //       model: "gemini-3.1-flash-lite",
      //       config: {
      //         systemInstruction: ARETE_SYSTEM_PROMPT,
      //         responseMimeType: "application/json",
      //       },
      //       contents: buildUserPlanPrompt(input) as any,
      //     }),
    );
  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
}

async function callModelWithRetry(fn: () => Promise<any>, maxRetries = 5) {
  let delay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.status || error?.error?.code;

      if (status !== 503 && status !== 429) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

type AdaptivePlanInput = {
  tasks: any[];
  checkIn: {
    yesterdayDifficulty?: string | null;
    yesterdayDifficultyNote?: string | null;
    energyScale?: number | null;
    availableTime?: string | null;
    todaysImpediments?: string | null;
    tasksToAdd?: string | null;
    tasksToRemove?: string | null;
  };
};

export async function generateAdaptiveDailyPlan({
  tasks,
  checkIn,
}: AdaptivePlanInput) {
  return callModelWithRetry(
    async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-ai", {
          body: {
            prompt: JSON.stringify({
              current_tasks: tasks,
              check_in: {
                ...checkIn,
                yesterday_plan_feedback:
                  checkIn.yesterdayDifficultyNote?.trim() || "",
              },
            }),
            systemInstruction: ADAPTIVE_PLAN_SYSTEM_PROMPT,
          },
        });

        if (error) {
          throw error;
        }

        return data;
      } catch (err: any) {
        const resp =
          err?.response || err?.context || err?.cause?.response || null;
        if (resp && typeof resp.json === "function") {
          try {
            const payload = await resp.json();
            throw new Error(`Edge function error: ${JSON.stringify(payload)}`);
          } catch {
            try {
              const text = await resp.text();
              throw new Error(`Edge function error: ${text}`);
            } catch {
              // fallthrough to original error
            }
          }
        }

        throw err;
      }
    },

    // return callModelWithRetry(() =>
    //   ai.models.generateContent({
    //     model: "gemini-3.1-flash-lite",
    //     config: {
    //       systemInstruction: ADAPTIVE_PLAN_SYSTEM_PROMPT,
    //       responseMimeType: "application/json",
    //     },
    //     contents: JSON.stringify({
    //       current_tasks: tasks,
    //       check_in: checkIn,
    //     }),
    //   }),
    // );
  );
}
