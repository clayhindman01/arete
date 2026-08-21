import { generateAdaptiveDailyPlan } from "@/lib/ai";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const mockedInvoke = supabase.functions.invoke as jest.Mock;

describe("adaptive daily plan generation", () => {
  beforeEach(() => {
    mockedInvoke.mockResolvedValue({
      data: { text: JSON.stringify({ summary: "Updated plan", tasks: [] }) },
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("includes the free-text yesterday plan feedback in the adaptive plan payload", async () => {
    await generateAdaptiveDailyPlan({
      tasks: [],
      recentPlans: [
        {
          plan_date: "2026-08-20",
          daily_tasks: [{ title: "Walk", completed: false }],
        },
      ],
      checkIn: {
        yesterdayDifficulty: "easy",
        yesterdayDifficultyNote:
          "The plan was a little too intense for my energy.",
        energyScale: 3,
        availableTime: "30to60",
        todaysImpediments: "Traveling later today",
      },
    });

    expect(mockedInvoke).toHaveBeenCalledWith(
      "generate-ai",
      expect.objectContaining({
        body: expect.objectContaining({
          prompt: expect.stringContaining("yesterday_plan_feedback"),
        }),
      }),
    );

    const request = mockedInvoke.mock.calls[0][1];
    expect(JSON.parse(request.body.prompt).recent_plans).toEqual([
      expect.objectContaining({ plan_date: "2026-08-20" }),
    ]);
  });
});
