import Button from "@/components/ui/Button";
import Loader from "@/components/ui/Loader";
import { getActivePlan, saveGeneratedPlan } from "@/lib/db";
import { useProfile } from "@/lib/ProfileContext";
import { validateTask } from "@/lib/taskValidation";
import type {
  DaysOfWeek,
  PlanGeneration,
} from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DAYS: { label: string; value: DaysOfWeek }[] = [
  { label: "S", value: "Su" },
  { label: "M", value: "M" },
  { label: "T", value: "T" },
  { label: "W", value: "W" },
  { label: "Th", value: "Th" },
  { label: "F", value: "F" },
  { label: "S", value: "S" },
];

export default function PlanScreen() {
  const router = useRouter();
  const { user } = useProfile();
  const [plan, setPlan] = useState<PlanGeneration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const activePlan = await getActivePlan();
        setPlan(activePlan.plan_json as PlanGeneration);
      } catch (error) {
        console.error("Unable to load active plan:", error);
        Alert.alert("Unable to load plan", "Please try again in a moment.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadPlan();
  }, []);

  const updateGoal = (field: "title" | "description", value: string) => {
    setPlan((current) =>
      current
        ? { ...current, goal: { ...current.goal, [field]: value } }
        : current,
    );
  };

  const updateTask = (
    commitmentIndex: number,
    routineIndex: number,
    taskIndex: number,
    updates: Partial<
      PlanGeneration["commitments"][number]["routines"][number]["tasks"][number]
    >,
  ) => {
    setPlan((current) => {
      if (!current) return current;

      return {
        ...current,
        commitments: current.commitments.map((commitment, currentCommitmentIndex) =>
          currentCommitmentIndex !== commitmentIndex
            ? commitment
            : {
                ...commitment,
                routines: commitment.routines.map((routine, currentRoutineIndex) =>
                  currentRoutineIndex !== routineIndex
                    ? routine
                    : {
                        ...routine,
                        tasks: routine.tasks.map((task, currentTaskIndex) =>
                          currentTaskIndex !== taskIndex
                            ? task
                            : { ...task, ...updates },
                        ),
                      },
                ),
              },
        ),
      };
    });
  };

  const updateRoutine = (
    commitmentIndex: number,
    routineIndex: number,
    updates: Partial<PlanGeneration["commitments"][number]["routines"][number]>,
  ) => {
    setPlan((current) => {
      if (!current) return current;

      return {
        ...current,
        commitments: current.commitments.map((commitment, currentCommitmentIndex) =>
          currentCommitmentIndex !== commitmentIndex
            ? commitment
            : {
                ...commitment,
                routines: commitment.routines.map((routine, currentRoutineIndex) =>
                  currentRoutineIndex !== routineIndex
                    ? routine
                    : { ...routine, ...updates },
                ),
              },
        ),
      };
    });
  };

  const addTask = (commitmentIndex: number, routineIndex: number) => {
    updateRoutine(commitmentIndex, routineIndex, {
      tasks: [
        ...(plan?.commitments[commitmentIndex]?.routines[routineIndex]?.tasks ?? []),
        {
          title: "",
          description: "",
          estimated_minutes: 30,
          one_word_description: "",
          completed: false,
        },
      ],
    });
  };

  const toggleDay = (
    commitmentIndex: number,
    routineIndex: number,
    day: DaysOfWeek,
  ) => {
    const routine = plan?.commitments[commitmentIndex]?.routines[routineIndex];
    if (!routine || routine.frequency === "daily") return;

    const days = routine.days_of_week.includes(day)
      ? routine.days_of_week.filter((currentDay) => currentDay !== day)
      : [...routine.days_of_week, day];

    if (days.length > 0) {
      updateRoutine(commitmentIndex, routineIndex, { days_of_week: days });
    }
  };

  const handleSave = async () => {
    if (!user?.id || !plan) return;
    if (!plan.goal.title.trim()) {
      Alert.alert("Add a goal", "Your plan needs a goal title.");
      return;
    }

    const hasInvalidTask = plan.commitments.some((commitment) =>
      commitment.routines.some((routine) =>
        routine.tasks.some((task) => Object.keys(validateTask(task)).length > 0),
      ),
    );
    const hasUnscheduledRoutine = plan.commitments.some((commitment) =>
      commitment.routines.some(
        (routine) => routine.frequency === "weekly" && routine.days_of_week.length === 0,
      ),
    );

    if (hasInvalidTask) {
      Alert.alert(
        "Complete each task",
        "Every task needs a title, description, and estimated time.",
      );
      return;
    }
    if (hasUnscheduledRoutine) {
      Alert.alert("Choose a day", "Select at least one day for each weekly routine.");
      return;
    }

    setIsSaving(true);
    try {
      await saveGeneratedPlan(user.id, plan);
      Alert.alert("Plan updated", "Your changes are now active.", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Unable to save plan:", error);
      Alert.alert("Unable to save plan", "Please try again in a moment.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewPlan = () => {
    Alert.alert(
      "Create a new goal?",
      "Creating a new goal will discard your current goal and plan.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => router.push("/(onboarding)/Onboarding"),
        },
      ],
    );
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#F8F8FB" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your plan</Text>
        <TouchableOpacity
          onPress={handleCreateNewPlan}
          accessibilityRole="button"
          accessibilityLabel="Create a new goal"
          style={styles.headerAction}
        >
          <MaterialCommunityIcons name="plus" size={25} color="#b89b5e" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.editorSurface}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Plan details</Text>
          <Text style={styles.subtitle}>
            Make small changes to your current plan, or start fresh when your direction changes.
          </Text>

          {plan ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current plan</Text>
              <Text style={styles.fieldLabel}>Goal title</Text>
              <TextInput
                value={plan.goal.title}
                onChangeText={(value) => updateGoal("title", value)}
                placeholder="Add a goal title"
                placeholderTextColor="#71717A"
                style={styles.input}
              />
              <Text style={styles.fieldLabel}>Goal details</Text>
              <TextInput
                value={plan.goal.description}
                onChangeText={(value) => updateGoal("description", value)}
                placeholder="What this goal means to you"
                placeholderTextColor="#71717A"
                multiline
                style={[styles.input, styles.descriptionInput]}
              />

              <Text style={[styles.fieldLabel, styles.tasksLabel]}>Tasks and schedule</Text>
              {plan.commitments.map((commitment, commitmentIndex) => (
                <View key={`${commitment.title}-${commitmentIndex}`} style={styles.commitment}>
                  <Text style={styles.commitmentTitle}>{commitment.title}</Text>
                  {commitment.routines.map((routine, routineIndex) => (
                    <View key={`${routine.title}-${routineIndex}`}>
                      <Text style={styles.routineTitle}>{routine.title}</Text>
                    <View style={styles.frequencyRow}>
                      <Text style={styles.scheduleLabel}>Frequency</Text>
                      {(["daily", "weekly"] as const).map((frequency) => (
                        <TouchableOpacity
                          key={frequency}
                          onPress={() =>
                            updateRoutine(commitmentIndex, routineIndex, {
                              frequency,
                              days_of_week:
                                frequency === "daily"
                                  ? DAYS.map((day) => day.value)
                                  : routine.days_of_week.length > 0
                                    ? routine.days_of_week
                                    : ["M"],
                            })
                          }
                          style={[
                            styles.frequencyOption,
                            routine.frequency === frequency && styles.selectedOption,
                          ]}
                        >
                          <Text
                            style={[
                              styles.frequencyText,
                              routine.frequency === frequency && styles.selectedOptionText,
                            ]}
                          >
                            {frequency === "daily" ? "Every day" : "Selected days"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {routine.frequency === "weekly" && (
                      <View style={styles.daysRow}>
                        {DAYS.map((day) => {
                          const selected = routine.days_of_week.includes(day.value);
                          return (
                            <TouchableOpacity
                              key={day.value}
                              onPress={() =>
                                toggleDay(commitmentIndex, routineIndex, day.value)
                              }
                              style={[styles.dayOption, selected && styles.selectedDay]}
                              accessibilityRole="button"
                              accessibilityLabel={`${day.value} ${selected ? "selected" : "not selected"}`}
                            >
                              <Text style={[styles.dayText, selected && styles.selectedOptionText]}>
                                {day.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                      {routine.tasks.map((task, taskIndex) => (
                        <View
                          key={`${commitmentIndex}-${routineIndex}-${taskIndex}`}
                          style={styles.taskFields}
                        >
                          <Text style={styles.taskLabel}>Task {taskIndex + 1}</Text>
                          <Text style={styles.inputLabel}>Task title</Text>
                        <TextInput
                          value={task.title}
                          onChangeText={(value) =>
                            updateTask(commitmentIndex, routineIndex, taskIndex, {
                              title: value,
                            })
                          }
                          placeholder="Task title"
                          placeholderTextColor="#71717A"
                          style={styles.taskInput}
                        />
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                          value={task.description}
                          onChangeText={(value) =>
                            updateTask(commitmentIndex, routineIndex, taskIndex, {
                              description: value,
                            })
                          }
                          placeholder="Describe what to do"
                          placeholderTextColor="#71717A"
                          multiline
                          style={[styles.taskInput, styles.taskDescriptionInput]}
                        />
                        <Text style={styles.inputLabel}>Estimated time (minutes)</Text>
                        <TextInput
                          value={task.estimated_minutes ? String(task.estimated_minutes) : ""}
                          onChangeText={(value) =>
                            updateTask(commitmentIndex, routineIndex, taskIndex, {
                              estimated_minutes: Number(value.replace(/[^0-9]/g, "")) || 0,
                            })
                          }
                          placeholder="Estimated time in minutes"
                          placeholderTextColor="#71717A"
                          keyboardType="numeric"
                          style={styles.taskInput}
                        />
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={() => addTask(commitmentIndex, routineIndex)}
                        style={styles.addTaskButton}
                        accessibilityRole="button"
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#b89b5e" />
                        <Text style={styles.addTaskText}>Add task</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}

              <Button
                label={isSaving ? "Saving..." : "Save changes"}
                type="primary"
                onPress={handleSave}
                disabled={isSaving}
              />
            </View>
          ) : (
            <Text style={styles.emptyState}>No active plan found.</Text>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#09090B" },
  keyboardView: { flex: 1 },
  editorSurface: { backgroundColor: "#0D1117" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: { padding: 6 },
  headerAction: { padding: 6 },
  headerTitle: { color: "#F8F8FB", fontSize: 18, fontWeight: "700" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "#F8F8FB", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#A1A1AA", fontSize: 15, lineHeight: 22, marginTop: 8 },
  section: { marginTop: 28 },
  sectionTitle: { color: "#F8F8FB", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  fieldLabel: {
    color: "#A1A1AA",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputLabel: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 2,
  },
  tasksLabel: { marginTop: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#232833",
    borderRadius: 8,
    color: "#F8F8FB",
    fontSize: 16,
    padding: 12,
    marginBottom: 10,
  },
  descriptionInput: { minHeight: 80, textAlignVertical: "top" },
  commitment: { marginTop: 18 },
  commitmentTitle: { color: "#b89b5e", fontSize: 16, fontWeight: "700" },
  routineTitle: { color: "#A1A1AA", fontSize: 14, marginTop: 10, marginBottom: 6 },
  frequencyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  scheduleLabel: { color: "#71717A", fontSize: 12, marginRight: 2 },
  frequencyOption: {
    borderWidth: 1,
    borderColor: "#232833",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedOption: { backgroundColor: "#b89b5e", borderColor: "#b89b5e" },
  frequencyText: { color: "#A1A1AA", fontSize: 12 },
  selectedOptionText: { color: "#09090B", fontWeight: "700" },
  daysRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  dayOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#232833",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDay: { backgroundColor: "#b89b5e", borderColor: "#b89b5e" },
  dayText: { color: "#A1A1AA", fontSize: 11, fontWeight: "600" },
  taskFields: {
    backgroundColor: "#151A22",
    borderColor: "#252C38",
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 12,
    padding: 12,
  },
  taskLabel: { color: "#71717A", fontSize: 12, marginBottom: 2 },
  taskInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#232833",
    color: "#F8F8FB",
    fontSize: 15,
    paddingVertical: 10,
  },
  taskDescriptionInput: { minHeight: 56, textAlignVertical: "top" },
  addTaskButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 10,
  },
  addTaskText: { color: "#b89b5e", fontSize: 14, fontWeight: "600" },
  emptyState: { color: "#A1A1AA", marginTop: 28 },
});
