import { ARETE_SYSTEM_PROMPT } from "@/prompts/arete-system-prompt";
import { ADAPTIVE_PLAN_SYSTEM_PROMPT } from "@/prompts/daily-checkin-plan-adaption";
import { buildUserPlanPrompt } from "@/prompts/prompt-utils";
import { OnboardingData } from "@/types/onboarding";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_KEY });

export async function generatePlan(input: OnboardingData) {
  return callModelWithRetry(() =>
    ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: ARETE_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
      contents: buildUserPlanPrompt(input) as any,
    }),
  );
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
  checkIn: any;
};

export async function generateAdaptiveDailyPlan({
  tasks,
  checkIn,
}: AdaptivePlanInput) {

  return callModelWithRetry(() =>
    ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      config: {
        systemInstruction: ADAPTIVE_PLAN_SYSTEM_PROMPT,
        responseMimeType: "application/json",
      },
      contents: JSON.stringify({
        current_tasks: tasks,
        check_in: checkIn,
      }),
    }),
  );


}