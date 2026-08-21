export type WeeklyGoal = {
  title: string;
  description?: string | null;
  target_date?: string | null;
};

export type WeeklyTaskRecord = {
  title?: string | null;
  completed?: boolean | null;
};

export type WeeklyDailyPlanRecord = {
  plan_date: string;
  daily_tasks?: WeeklyTaskRecord[] | null;
};

export type WeeklyCheckInRecord = {
  created_at?: string | null;
  difficulty_rating?: string | null;
  difficulty_note?: string | null;
  energy_level?: number | null;
  available_time?: string | null;
  notes?: string | null;
};

export type WeeklyDaySummary = {
  date: string;
  label: string;
  total: number;
  completed: number;
  completionRate: number;
};

export type WeeklyCommitmentSummary = {
  title: string;
  planned: number;
  completed: number;
  completionRate: number;
};

export type WeeklyInsightStat = {
  label: string;
  completionRate: number;
  count: number;
};

export type WeeklyReportData = {
  weekStart: string;
  weekEnd: string;
  overallCompletionRate: number;
  plannedTotal: number;
  completedTotal: number;
  previousWeekCompletionRate: number | null;
  previousWeekDelta: number | null;
  dailyCompletion: WeeklyDaySummary[];
  strongestDay: WeeklyDaySummary | null;
  weakestDay: WeeklyDaySummary | null;
  consistencyScore: number;
  commitmentStats: WeeklyCommitmentSummary[];
  bestCommitments: WeeklyCommitmentSummary[];
  lowestCommitments: WeeklyCommitmentSummary[];
  goal: WeeklyGoal;
  goalCompletionRate: number;
  planQuality: {
    goodCount: number;
    badCount: number;
    goodRate: number;
    badRate: number;
    strongDays: number;
    poorDays: number;
  };
  energyStats: {
    lowEnergyCompletionRate: number;
    normalEnergyCompletionRate: number;
    highEnergyCompletionRate: number;
    lowEnergyDays: number;
    highEnergyDays: number;
    enoughData: boolean;
  };
  timeStats: {
    limitedTimeCompletionRate: number;
    moderateTimeCompletionRate: number;
    ampleTimeCompletionRate: number;
    limitedTimeDays: number;
    enoughData: boolean;
  };
  obstacleSummary: Array<{
    label: string;
    count: number;
    completionRate: number;
  }>;
  wins: string[];
  improvementAreas: string[];
  nextWeekFocus: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateKey(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.includes("T") ? value.slice(0, 10) : value;
  return normalized;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRangeInclusive(startDateKey: string, endDateKey: string) {
  const dates: string[] = [];
  const start = new Date(`${startDateKey}T00:00:00`);
  const end = new Date(`${endDateKey}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return dates;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(formatDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getLastSevenDates(referenceDate = new Date()) {
  const days: string[] = [];
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(start);
    date.setDate(start.getDate() - index);
    days.push(formatDateKey(date));
  }
  return days;
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function completionRate(completed: number, total: number) {
  if (total === 0) return 0;
  return completed / total;
}

function dayLabel(dateKey: string) {
  const value = new Date(`${dateKey}T12:00:00`);
  return DAY_LABELS[value.getDay()];
}

function isGoodDifficulty(value: string | null | undefined) {
  return value === "about-right" || value === "easy" || value === "very-easy";
}

function getPlanQualitySummary(checkIns: WeeklyCheckInRecord[]) {
  const goodCount = checkIns.filter((checkIn) =>
    isGoodDifficulty(checkIn.difficulty_rating),
  ).length;
  const badCount = checkIns.length - goodCount;

  return {
    goodCount,
    badCount,
    goodRate: checkIns.length ? goodCount / checkIns.length : 0,
    badRate: checkIns.length ? badCount / checkIns.length : 0,
    strongDays: goodCount,
    poorDays: badCount,
  };
}

function getEnergyStats(
  dailyPlans: WeeklyDailyPlanRecord[],
  checkIns: WeeklyCheckInRecord[],
) {
  const checkInByDate = new Map<string, WeeklyCheckInRecord>();
  for (const checkIn of checkIns) {
    const key = toDateKey(checkIn.created_at);
    if (key) {
      checkInByDate.set(key, checkIn);
    }
  }

  const lowEnergyDays: number[] = [];
  const normalEnergyDays: number[] = [];
  const highEnergyDays: number[] = [];

  for (const plan of dailyPlans) {
    const dateKey = plan.plan_date;
    const checkIn = checkInByDate.get(dateKey);
    const tasks = plan.daily_tasks ?? [];
    const completed = tasks.filter((task) => Boolean(task.completed)).length;
    const total = tasks.length;
    const rate = completionRate(completed, total);

    if (checkIn?.energy_level != null) {
      if (checkIn.energy_level <= 2) {
        lowEnergyDays.push(rate);
      } else if (checkIn.energy_level === 3) {
        normalEnergyDays.push(rate);
      } else {
        highEnergyDays.push(rate);
      }
    }
  }

  const enoughData =
    lowEnergyDays.length > 0 ||
    normalEnergyDays.length > 0 ||
    highEnergyDays.length > 0;

  return {
    lowEnergyCompletionRate: avg(lowEnergyDays),
    normalEnergyCompletionRate: avg(normalEnergyDays),
    highEnergyCompletionRate: avg(highEnergyDays),
    lowEnergyDays: lowEnergyDays.length,
    highEnergyDays: highEnergyDays.length,
    enoughData,
  };
}

function getTimeStats(
  dailyPlans: WeeklyDailyPlanRecord[],
  checkIns: WeeklyCheckInRecord[],
) {
  const checkInByDate = new Map<string, WeeklyCheckInRecord>();
  for (const checkIn of checkIns) {
    const key = toDateKey(checkIn.created_at);
    if (key) {
      checkInByDate.set(key, checkIn);
    }
  }

  const limited: number[] = [];
  const moderate: number[] = [];
  const ample: number[] = [];

  for (const plan of dailyPlans) {
    const checkIn = checkInByDate.get(plan.plan_date);
    const tasks = plan.daily_tasks ?? [];
    const completed = tasks.filter((task) => Boolean(task.completed)).length;
    const total = tasks.length;
    const rate = completionRate(completed, total);

    if (!checkIn?.available_time) continue;

    if (checkIn.available_time === "lessThan15") {
      limited.push(rate);
    } else if (
      checkIn.available_time === "15to30" ||
      checkIn.available_time === "30to60"
    ) {
      moderate.push(rate);
    } else {
      ample.push(rate);
    }
  }

  return {
    limitedTimeCompletionRate: avg(limited),
    moderateTimeCompletionRate: avg(moderate),
    ampleTimeCompletionRate: avg(ample),
    limitedTimeDays: limited.length,
    enoughData: limited.length > 0 || moderate.length > 0 || ample.length > 0,
  };
}

function collectObstacleSummary(checkIns: WeeklyCheckInRecord[]) {
  const obstacleCounts = new Map<string, number>();
  const obstacleRates = new Map<string, number[]>();
  const dailyPlansByDate = new Map<string, WeeklyDailyPlanRecord>();

  for (const checkIn of checkIns) {
    const dateKey = toDateKey(checkIn.created_at);
    if (!dateKey) continue;
    const notesText = [checkIn.notes, checkIn.difficulty_note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const tokens = notesText
      .split(/[\s,;./()\-]+/)
      .map((token) => token.trim())
      .filter(Boolean);

    const matched = new Set<string>();

    const keywordMap = [
      {
        label: "time",
        keywords: [
          "time",
          "busy",
          "schedule",
          "tight",
          "limited",
          "deadline",
          "appointment",
          "late",
        ],
      },
      {
        label: "energy",
        keywords: [
          "energy",
          "tired",
          "exhausted",
          "sleep",
          "low energy",
          "motivation",
        ],
      },
      {
        label: "travel",
        keywords: ["travel", "commute", "out of town", "errands", "moving"],
      },
      {
        label: "focus",
        keywords: ["focus", "distracted", "overwhelmed", "stress", "brain"],
      },
      {
        label: "health",
        keywords: ["sick", "pain", "injury", "recovery", "unwell"],
      },
    ];

    for (const entry of keywordMap) {
      if (entry.keywords.some((keyword) => tokens.includes(keyword))) {
        matched.add(entry.label);
      }
    }

    if (matched.size === 0 && notesText.trim()) {
      matched.add("other");
    }

    for (const label of matched) {
      obstacleCounts.set(label, (obstacleCounts.get(label) ?? 0) + 1);
    }
  }

  const result: Array<{
    label: string;
    count: number;
    completionRate: number;
  }> = [];

  for (const [label, count] of obstacleCounts.entries()) {
    const matchedPlans: number[] = [];
    for (const checkIn of checkIns) {
      const dateKey = toDateKey(checkIn.created_at);
      if (!dateKey) continue;
      const notesText = [checkIn.notes, checkIn.difficulty_note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const keywords =
        {
          time: [
            "time",
            "busy",
            "schedule",
            "tight",
            "limited",
            "deadline",
            "appointment",
            "late",
          ],
          energy: [
            "energy",
            "tired",
            "exhausted",
            "sleep",
            "low energy",
            "motivation",
          ],
          travel: ["travel", "commute", "out of town", "errands", "moving"],
          focus: ["focus", "distracted", "overwhelmed", "stress", "brain"],
          health: ["sick", "pain", "injury", "recovery", "unwell"],
          other: [""],
        }[label] ?? [];

      if (
        keywords.length === 0 ||
        keywords.some((keyword) => notesText.includes(keyword))
      ) {
        const plan = dailyPlansByDate.get(dateKey);
        if (!plan) continue;
        const tasks = plan.daily_tasks ?? [];
        const completed = tasks.filter((task) =>
          Boolean(task.completed),
        ).length;
        matchedPlans.push(completionRate(completed, tasks.length));
      }
    }

    result.push({
      label,
      count,
      completionRate: matchedPlans.length ? avg(matchedPlans) : 0,
    });
  }

  return result.sort(
    (left, right) =>
      right.count - left.count || right.completionRate - left.completionRate,
  );
}

export function buildWeeklyReport({
  dailyPlans,
  checkIns,
  goal,
  previousWeekCompletionRate = null,
  weekStart,
  weekEnd,
}: {
  dailyPlans: WeeklyDailyPlanRecord[];
  checkIns: WeeklyCheckInRecord[];
  goal: WeeklyGoal;
  previousWeekCompletionRate?: number | null;
  weekStart?: string;
  weekEnd?: string;
}) {
  const dates =
    weekStart && weekEnd
      ? getDateRangeInclusive(weekStart, weekEnd)
      : getLastSevenDates();
  const planMap = new Map<string, WeeklyDailyPlanRecord>();
  for (const plan of dailyPlans) {
    const key = toDateKey(plan.plan_date);
    if (key) {
      planMap.set(key, plan);
    }
  }

  const dailyCompletion: WeeklyDaySummary[] = dates.map((dateKey) => {
    const plan = planMap.get(dateKey);
    const tasks = plan?.daily_tasks ?? [];
    const completed = tasks.filter((task) => Boolean(task.completed)).length;
    return {
      date: dateKey,
      label: dayLabel(dateKey),
      total: tasks.length,
      completed,
      completionRate: completionRate(completed, tasks.length),
    };
  });

  const filteredDays = dailyCompletion.filter((day) => day.total > 0);
  const strongestDay = filteredDays.length
    ? [...filteredDays].sort(
        (left, right) => right.completionRate - left.completionRate,
      )[0]
    : null;
  const weakestDay = filteredDays.length
    ? [...filteredDays].sort(
        (left, right) => left.completionRate - right.completionRate,
      )[0]
    : null;

  const totalCompleted = dailyCompletion.reduce(
    (sum, day) => sum + day.completed,
    0,
  );
  const totalPlanned = dailyCompletion.reduce((sum, day) => sum + day.total, 0);
  const overallCompletionRate = completionRate(totalCompleted, totalPlanned);
  const consistencyScore = avg(
    dailyCompletion.map((day) => day.completionRate),
  );

  const commitmentMap = new Map<
    string,
    { planned: number; completed: number }
  >();
  for (const plan of dailyPlans) {
    for (const task of plan.daily_tasks ?? []) {
      const title =
        (task.title ?? "Untitled commitment").trim() || "Untitled commitment";
      const current = commitmentMap.get(title) ?? { planned: 0, completed: 0 };
      current.planned += 1;
      if (task.completed) current.completed += 1;
      commitmentMap.set(title, current);
    }
  }

  const commitmentStats: WeeklyCommitmentSummary[] = [
    ...commitmentMap.entries(),
  ]
    .map(([title, value]) => ({
      title,
      planned: value.planned,
      completed: value.completed,
      completionRate: completionRate(value.completed, value.planned),
    }))
    .sort(
      (left, right) =>
        right.planned - left.planned ||
        right.completionRate - left.completionRate,
    );

  const bestCommitments = [...commitmentStats]
    .filter((entry) => entry.planned > 0)
    .sort((left, right) => right.completionRate - left.completionRate)
    .slice(0, 3);

  const lowestCommitments = [...commitmentStats]
    .filter((entry) => entry.planned > 0)
    .sort((left, right) => left.completionRate - right.completionRate)
    .slice(0, 3);

  const planQuality = getPlanQualitySummary(checkIns);
  const energyStats = getEnergyStats(dailyPlans, checkIns);
  const timeStats = getTimeStats(dailyPlans, checkIns);
  const obstacleSummary = collectObstacleSummary(checkIns);

  const previousWeekDelta =
    previousWeekCompletionRate == null
      ? null
      : Number((overallCompletionRate - previousWeekCompletionRate).toFixed(4));

  const goalCompletionRate = overallCompletionRate;
  const goalRecord: WeeklyGoal = {
    title: goal?.title || "Your goal",
    description: goal?.description ?? null,
    target_date: goal?.target_date ?? null,
  };

  const wins: string[] = [];
  if (strongestDay && strongestDay.completionRate >= 0.8) {
    wins.push(
      `You were strongest on ${strongestDay.label} with ${Math.round(strongestDay.completionRate * 100)}% completion.`,
    );
  }
  if (
    energyStats.enoughData &&
    energyStats.highEnergyCompletionRate >
      energyStats.lowEnergyCompletionRate + 0.2
  ) {
    wins.push(
      `You were much more consistent on high-energy days, finishing ${Math.round(energyStats.highEnergyCompletionRate * 100)}% of commitments versus ${Math.round(energyStats.lowEnergyCompletionRate * 100)}% on low-energy days.`,
    );
  }
  if (previousWeekDelta != null && previousWeekDelta > 0) {
    wins.push(
      `Your completion rate improved from ${Math.round((previousWeekCompletionRate ?? 0) * 100)}% last week to ${Math.round(overallCompletionRate * 100)}% this week.`,
    );
  }
  if (!wins.length) {
    wins.push(
      "You kept a consistent rhythm this week and built momentum over the last seven days.",
    );
  }

  const improvementAreas: string[] = [];
  if (weakestDay && weakestDay.completionRate < 0.6) {
    improvementAreas.push(
      `${weakestDay.label} was your weakest day, dropping to ${Math.round(weakestDay.completionRate * 100)}% completion.`,
    );
  }
  if (planQuality.badCount > planQuality.goodCount) {
    improvementAreas.push(
      `More of your plans were challenging than helpful, which suggests the week may have been too ambitious for your energy and time.`,
    );
  }
  if (
    timeStats.enoughData &&
    timeStats.limitedTimeCompletionRate <
      timeStats.ampleTimeCompletionRate - 0.15
  ) {
    improvementAreas.push(
      `Limited time was a clear drag on momentum, with your completion rate dropping on days with less than 15 minutes available.`,
    );
  }
  if (!improvementAreas.length) {
    improvementAreas.push(
      "Your biggest opportunity is to keep the plan realistic and protect your most important commitments.",
    );
  }

  let nextWeekFocus =
    "Keep the plan realistic and protect the time you actually have available.";
  if (
    timeStats.enoughData &&
    timeStats.limitedTimeCompletionRate <=
      (timeStats.ampleTimeCompletionRate || 0.8) - 0.1
  ) {
    nextWeekFocus =
      "Protect your limited-time days. Keep the plan intentionally small when you have less than 15 minutes available so your highest-value commitments still get done.";
  } else if (weakestDay && weakestDay.completionRate < 0.6) {
    nextWeekFocus = `Protect your ${weakestDay.label} rhythm. Your lowest completion was on ${weakestDay.label}, so move the hardest commitment earlier in the day or reduce it for next week.`;
  } else if (goalRecord.title) {
    nextWeekFocus = `Keep the plan aligned with ${goalRecord.title}. Focus your effort on the commitments that move this goal forward most consistently.`;
  }

  return {
    weekStart: dates[0],
    weekEnd: dates[dates.length - 1],
    overallCompletionRate,
    plannedTotal: totalPlanned,
    completedTotal: totalCompleted,
    previousWeekCompletionRate,
    previousWeekDelta,
    dailyCompletion,
    strongestDay,
    weakestDay,
    consistencyScore,
    commitmentStats,
    bestCommitments,
    lowestCommitments,
    goal: goalRecord,
    goalCompletionRate,
    planQuality,
    energyStats,
    timeStats,
    obstacleSummary,
    wins,
    improvementAreas,
    nextWeekFocus,
  } satisfies WeeklyReportData;
}
