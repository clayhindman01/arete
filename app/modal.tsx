import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Loader from "@/components/ui/Loader";
import {
  getActivePlan,
  getRecentDailyPlans,
  getWeeklyCheckIns,
} from "@/lib/db";
import { buildWeeklyReport, type WeeklyReportData } from "@/lib/weeklyReport";

function getPreviousSundaySaturdayWindow(referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());

  const weekStart = new Date(currentSunday);
  weekStart.setDate(currentSunday.getDate() - 7);

  const weekEnd = new Date(currentSunday);
  weekEnd.setDate(currentSunday.getDate() - 1);

  return {
    weekStart: weekStart.toISOString().slice(0, 10),
    weekEnd: weekEnd.toISOString().slice(0, 10),
  };
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function formatDay(dateKey: string) {
  if (!dateKey) return "—";
  const value = new Date(`${dateKey}T12:00:00`);
  return value.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ModalScreen() {
  const router = useRouter();
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      const [currentPlan, recentPlans, checkIns] = await Promise.all([
        getActivePlan().catch(() => null),
        getRecentDailyPlans(),
        getWeeklyCheckIns(),
      ]);

      const weekWindow = getPreviousSundaySaturdayWindow();
      const weeklyPlans = recentPlans.filter((plan) => {
        const planDate = plan.plan_date;
        if (!planDate) return false;
        return (
          planDate >= weekWindow.weekStart && planDate <= weekWindow.weekEnd
        );
      });

      const previousWindow = getPreviousSundaySaturdayWindow(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      );
      const previousWeekPlans = recentPlans.filter((plan) => {
        const planDate = plan.plan_date;
        if (!planDate) return false;
        return (
          planDate >= previousWindow.weekStart &&
          planDate <= previousWindow.weekEnd
        );
      });

      const previousTotal = previousWeekPlans.reduce(
        (sum, plan) => sum + (plan.daily_tasks ?? []).length,
        0,
      );
      const previousCompleted = previousWeekPlans.reduce(
        (sum, plan) =>
          sum +
          (plan.daily_tasks ?? []).filter((task) => Boolean(task.completed))
            .length,
        0,
      );
      const previousWeekCompletionRate =
        previousTotal > 0 ? previousCompleted / previousTotal : null;

      const relevantCheckIns = checkIns.filter((entry) => {
        const entryDate = entry.created_at?.slice(0, 10);
        if (!entryDate) return false;
        return (
          entryDate >= weekWindow.weekStart && entryDate <= weekWindow.weekEnd
        );
      });

      const nextReport = buildWeeklyReport({
        dailyPlans: weeklyPlans,
        checkIns: relevantCheckIns,
        goal: {
          title: currentPlan?.goal ?? "Your goal",
          description: currentPlan?.summary ?? null,
          target_date: currentPlan?.goal_target_date ?? null,
        },
        previousWeekCompletionRate,
        weekStart: weekWindow.weekStart,
        weekEnd: weekWindow.weekEnd,
      });

      setReport(nextReport);
    } catch (error) {
      console.error("Failed to load weekly report", error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadReport();
    }, [loadReport]),
  );

  const insightText = useMemo(() => {
    if (!report) return "Your weekly review is ready.";
    return `You completed ${formatPercent(report.overallCompletionRate)} of your commitments this week.`;
  }, [report]);

  if (loading || !report) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Text style={styles.eyebrow}>Weekly review</Text>
          <TouchableOpacity
            onPress={() => {
              router.push({
                pathname: "/(tabs)",
                params: { shouldShowIntro: "false" },
              });
            }}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Here’s how your week went.</Text>
        <Text style={styles.summary}>{insightText}</Text>

        <View style={styles.primaryCard}>
          <Text style={styles.primaryMetric}>
            {formatPercent(report.overallCompletionRate)}
          </Text>
          <Text style={styles.primarySubtext}>
            {report.completedTotal} of {report.plannedTotal} commitments
            completed
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Your week</Text>
          <View style={styles.dayGrid}>
            {report.dailyCompletion.map((day) => (
              <View key={day.date} style={styles.dayItem}>
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(0, Math.min(100, day.completionRate * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayValue}>
                  {formatPercent(day.completionRate)}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.inlineText}>
            <Text style={styles.inlineLabel}>Strongest day:</Text>{" "}
            {report.strongestDay
              ? `${report.strongestDay.label} · ${formatPercent(report.strongestDay.completionRate)}`
              : "Not enough data yet"}
          </Text>
          <Text style={styles.inlineText}>
            <Text style={styles.inlineLabel}>Weakest day:</Text>{" "}
            {report.weakestDay
              ? `${report.weakestDay.label} · ${formatPercent(report.weakestDay.completionRate)}`
              : "Not enough data yet"}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Commitment performance</Text>
          {report.bestCommitments.slice(0, 3).map((commitment) => (
            <View key={commitment.title} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{commitment.title}</Text>
              <Text style={styles.rowMeta}>
                {commitment.completed}/{commitment.planned} complete
              </Text>
            </View>
          ))}
          {report.lowestCommitments.length > 0 && (
            <Text style={styles.inlineText}>
              <Text style={styles.inlineLabel}>Biggest drop:</Text>{" "}
              {report.lowestCommitments[0].title} at{" "}
              {formatPercent(report.lowestCommitments[0].completionRate)}
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Check-in insights</Text>
          <Text style={styles.inlineText}>
            <Text style={styles.inlineLabel}>Plan quality:</Text>{" "}
            {report.planQuality.goodCount} positive plans vs{" "}
            {report.planQuality.badCount} rough ones.
          </Text>
          {report.energyStats.enoughData && (
            <Text style={styles.inlineText}>
              <Text style={styles.inlineLabel}>Energy:</Text> You completed{" "}
              {formatPercent(report.energyStats.highEnergyCompletionRate)} on
              high-energy days versus{" "}
              {formatPercent(report.energyStats.lowEnergyCompletionRate)} on
              low-energy days.
            </Text>
          )}
          {report.timeStats.enoughData && (
            <Text style={styles.inlineText}>
              <Text style={styles.inlineLabel}>Time:</Text> Limited-time days
              were noticeably harder at{" "}
              {formatPercent(report.timeStats.limitedTimeCompletionRate)}{" "}
              completion.
            </Text>
          )}
          {report.obstacleSummary.length > 0 && (
            <Text style={styles.inlineText}>
              <Text style={styles.inlineLabel}>Biggest obstacle:</Text>{" "}
              {report.obstacleSummary[0].label} showed up{" "}
              {report.obstacleSummary[0].count} times.
            </Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Wins</Text>
          {report.wins.map((win, index) => (
            <Text key={`${win}-${index}`} style={styles.bulletText}>
              • {win}
            </Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Areas for improvement</Text>
          {report.improvementAreas.map((area, index) => (
            <Text key={`${area}-${index}`} style={styles.bulletText}>
              • {area}
            </Text>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Next week’s focus</Text>
          <Text style={styles.focusText}>{report.nextWeekFocus}</Text>
        </View>

        {report.previousWeekCompletionRate != null && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Compared with last week</Text>
            <Text style={styles.inlineText}>
              {formatPercent(report.previousWeekCompletionRate)} last week vs{" "}
              {formatPercent(report.overallCompletionRate)} this week.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  container: {
    flex: 1,
    backgroundColor: "#09090B",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  eyebrow: {
    color: "#A1A1AA",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  closeText: {
    color: "#C4B5FD",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    color: "#F4F4F5",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  summary: {
    color: "#D4D4D8",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },
  primaryCard: {
    backgroundColor: "#111827",
    borderColor: "#27272A",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },
  primaryMetric: {
    color: "#C4B5FD",
    fontSize: 36,
    fontWeight: "800",
  },
  primarySubtext: {
    color: "#A1A1AA",
    fontSize: 14,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: "#111318",
    borderColor: "#232833",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#F4F4F5",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  dayGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
    marginBottom: 8,
  },
  dayItem: {
    flex: 1,
    alignItems: "center",
    minHeight: 84,
  },
  dayLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    marginBottom: 8,
  },
  barTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#1F2937",
    overflow: "hidden",
    marginBottom: 6,
  },
  barFill: {
    height: "100%",
    backgroundColor: "#8B5CF6",
    borderRadius: 999,
  },
  dayValue: {
    color: "#E4E4E7",
    fontSize: 11,
  },
  inlineText: {
    color: "#E4E4E7",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  inlineLabel: {
    color: "#A1A1AA",
    fontWeight: "700",
  },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomColor: "#232833",
    borderBottomWidth: 1,
  },
  rowTitle: {
    color: "#F4F4F5",
    fontSize: 14,
    fontWeight: "600",
  },
  rowMeta: {
    color: "#A1A1AA",
    fontSize: 12,
  },
  bulletText: {
    color: "#E4E4E7",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  focusText: {
    color: "#F4F4F5",
    fontSize: 15,
    lineHeight: 24,
  },
});
