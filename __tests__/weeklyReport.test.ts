import {
    buildWeeklyReport,
    type WeeklyCheckInRecord,
    type WeeklyDailyPlanRecord,
} from "@/lib/weeklyReport";

describe("weekly report aggregation", () => {
  it("summarizes completion, strongest day, and check-in patterns from actual app data", () => {
    const dailyPlans: WeeklyDailyPlanRecord[] = [
      {
        plan_date: "2026-08-17",
        daily_tasks: [
          { title: "Workout", completed: true },
          { title: "Read", completed: true },
          { title: "Stretch", completed: false },
        ],
      },
      {
        plan_date: "2026-08-18",
        daily_tasks: [
          { title: "Workout", completed: true },
          { title: "Read", completed: false },
          { title: "Stretch", completed: true },
        ],
      },
      {
        plan_date: "2026-08-19",
        daily_tasks: [
          { title: "Workout", completed: false },
          { title: "Read", completed: false },
          { title: "Stretch", completed: false },
        ],
      },
    ];

    const checkIns: WeeklyCheckInRecord[] = [
      {
        created_at: "2026-08-17T09:00:00.000Z",
        difficulty_rating: "about-right",
        energy_level: 4,
        available_time: "30to60",
        notes: "Travel later",
      },
      {
        created_at: "2026-08-18T09:00:00.000Z",
        difficulty_rating: "difficult",
        energy_level: 2,
        available_time: "lessThan15",
        notes: "Time was tight",
      },
      {
        created_at: "2026-08-19T09:00:00.000Z",
        difficulty_rating: "very-difficult",
        energy_level: 1,
        available_time: "lessThan15",
        notes: "Low energy and time",
      },
    ];

    const report = buildWeeklyReport({
      dailyPlans,
      checkIns,
      goal: {
        title: "Build consistency",
        description: "Stay active",
        target_date: "2026-09-01",
      },
      previousWeekCompletionRate: 0.5,
    });

    expect(report.overallCompletionRate).toBeCloseTo(0.444, 3);
    expect(report.strongestDay?.date).toBe("2026-08-17");
    expect(report.weakestDay?.date).toBe("2026-08-19");
    expect(report.planQuality.goodCount).toBe(1);
    expect(report.planQuality.badCount).toBe(2);
    expect(report.energyStats.lowEnergyCompletionRate).toBeCloseTo(0.333, 3);
    expect(report.nextWeekFocus).toContain("time");
  });

  it("respects an explicit Sunday-Saturday window for day-by-day rows", () => {
    const dailyPlans: WeeklyDailyPlanRecord[] = [
      {
        plan_date: "2026-08-09",
        daily_tasks: [
          { title: "Workout", completed: true },
          { title: "Read", completed: false },
        ],
      },
      {
        plan_date: "2026-08-10",
        daily_tasks: [
          { title: "Workout", completed: true },
          { title: "Read", completed: true },
        ],
      },
      {
        plan_date: "2026-08-15",
        daily_tasks: [
          { title: "Workout", completed: false },
          { title: "Read", completed: false },
        ],
      },
    ];

    const report = buildWeeklyReport({
      dailyPlans,
      checkIns: [],
      goal: {
        title: "Build consistency",
      },
      weekStart: "2026-08-09",
      weekEnd: "2026-08-15",
    });

    expect(report.weekStart).toBe("2026-08-09");
    expect(report.weekEnd).toBe("2026-08-15");
    expect(report.dailyCompletion).toHaveLength(7);
    expect(report.dailyCompletion[0].date).toBe("2026-08-09");
    expect(report.dailyCompletion[1].date).toBe("2026-08-10");
    expect(report.dailyCompletion[6].date).toBe("2026-08-15");
    expect(report.dailyCompletion[0].total).toBe(2);
    expect(report.dailyCompletion[1].completed).toBe(2);
    expect(report.dailyCompletion[6].completionRate).toBe(0);
  });
});
