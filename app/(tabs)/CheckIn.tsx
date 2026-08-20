import Button from "@/components/ui/Button";
import ButtonGroup from "@/components/ui/ButtonGroup";
import Loader from "@/components/ui/Loader";
import TextField from "@/components/ui/TextField";
import { generateAdaptiveDailyPlan } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { trackEvent } from "@/lib/analytics";
import { createDailyCheckIn, saveAdaptiveDailyPlan } from "@/lib/db";
import { TaskValidationErrors, validateTask } from "@/lib/taskValidation";
import { getCurrentDateWithTimezoneOffset } from "@/lib/utils";
import { AVAILABLE_TIME_OPTIONS, AvailableTime } from "@/types/onboarding";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type StepType = 1 | 1.5 | 2 | 3 | 4 | 5 | 6;
export type YesterdayDifficulty =
  | "very-easy"
  | "easy"
  | "about-right"
  | "difficult"
  | "very-difficult";
export type EnergyScale = 1 | 2 | 3 | 4 | 5;

export const YESTERDAY_DIFFICULTY_OPTIONS = [
  { label: "Very Easy", value: "very-easy" as YesterdayDifficulty },
  { label: "Easy", value: "easy" as YesterdayDifficulty },
  { label: "About Right", value: "about-right" as YesterdayDifficulty },
  { label: "Difficult", value: "difficult" as YesterdayDifficulty },
  { label: "Very Difficult", value: "very-difficult" as YesterdayDifficulty },
];

export const ENERGY_SCALE = [
  { label: "Running on empty", value: 1 as EnergyScale },
  { label: "Low energy", value: 2 as EnergyScale },
  { label: "Normal", value: 3 as EnergyScale },
  { label: "High energy", value: 4 as EnergyScale },
  { label: "High on life", value: 5 as EnergyScale },
];

export interface CheckInValue {
  yesterdayDifficulty: YesterdayDifficulty | null;
  yesterdayDifficultyNote: string;
  energyScale: EnergyScale | null;
  availableTime: AvailableTime | null;
  todaysImpediments: string;
  tasksToAdd?: string;
  tasksToRemove?: string;
}

type PlannedTask = {
  id?: string;
  title: string;
  description: string;
  estimated_minutes: number;
  completed?: boolean;
};

export default function CheckIn() {
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const checkInTrackedRef = useRef(false);
  const params = useLocalSearchParams();
  const [checkInValue, setCheckInValue] = useState<CheckInValue>({
    yesterdayDifficulty: null,
    yesterdayDifficultyNote: "",
    energyScale: null,
    availableTime: null,
    todaysImpediments: "",
    tasksToAdd: "",
    tasksToRemove: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [difficultyNoteError, setDifficultyNoteError] = useState<string>("");
  const [taskErrors, setTaskErrors] = useState<
    Record<number, TaskValidationErrors>
  >({});
  const [reviewError, setReviewError] = useState<string>("");
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<{
    summary: string;
    tasks: PlannedTask[];
  }>({
    summary: "",
    tasks: [],
  });

  const router = useRouter();

  function onDifficultyChange(value: YesterdayDifficulty) {
    setCheckInValue({
      ...checkInValue,
      yesterdayDifficulty: value,
    });
    setDifficultyNoteError("");

    if (value === "about-right") {
      setCurrentStep(2);
      return;
    }

    setCurrentStep(1.5 as StepType);
  }

  function continueFromDifficultyStep() {
    const requiresNote =
      checkInValue.yesterdayDifficulty !== null &&
      checkInValue.yesterdayDifficulty !== "about-right";

    if (!requiresNote) {
      setCurrentStep(2);
      return;
    }

    if (!checkInValue.yesterdayDifficultyNote.trim()) {
      setDifficultyNoteError("Please tell us what was off about the plan.");
      return;
    }

    setDifficultyNoteError("");
    setCurrentStep(2);
  }

  function updateGeneratedTask(index: number, updates: Partial<PlannedTask>) {
    setGeneratedPlan((previousPlan) => ({
      ...previousPlan,
      tasks: previousPlan.tasks.map((task, taskIndex) =>
        taskIndex === index ? { ...task, ...updates } : task,
      ),
    }));
  }

  function updateTaskError(index: number, task: PlannedTask) {
    const nextErrors = validateTask(task);
    setTaskErrors((previous) => ({
      ...previous,
      [index]: nextErrors,
    }));
    return nextErrors;
  }

  function addGeneratedTask() {
    setGeneratedPlan((previousPlan) => {
      const nextTasks = [
        ...previousPlan.tasks,
        {
          title: "",
          description: "",
          estimated_minutes: 30,
          completed: false,
        },
      ];
      const newIndex = nextTasks.length - 1;
      setTaskErrors((previous) => ({
        ...previous,
        [newIndex]: validateTask(nextTasks[newIndex]),
      }));
      setEditingTaskIndex(newIndex);
      return { ...previousPlan, tasks: nextTasks };
    });
  }

  function removeGeneratedTask(index: number) {
    setGeneratedPlan((previousPlan) => ({
      ...previousPlan,
      tasks: previousPlan.tasks.filter((_, taskIndex) => taskIndex !== index),
    }));

    if (editingTaskIndex === index) {
      setEditingTaskIndex(null);
    }
  }

  async function submitCheckIn(checkIn: any) {
    setIsLoading(true);

    const user = await getCurrentUser();

    generateAdaptiveDailyPlan({
      tasks: JSON.parse(params.todaysTasks as string),
      checkIn,
    })
      .then(async (res) => {
        const parsedPlan = JSON.parse(res.text);
        const normalizedPlan = {
          summary: parsedPlan.summary ?? "",
          tasks: Array.isArray(parsedPlan.tasks)
            ? parsedPlan.tasks.map((task: any) => ({
                id: task.id,
                title: task.title ?? "",
                description: task.description ?? "",
                estimated_minutes: Number(task.estimated_minutes ?? 30),
                completed: Boolean(task.completed),
              }))
            : [],
        };

        setGeneratedPlan(normalizedPlan);
        setCurrentStep(6);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error generating adaptive plan:", error);
        setIsLoading(false);
      });
  }

  async function saveReviewedPlan() {
    if (checkInTrackedRef.current) {
      return;
    }

    if (!generatedPlan.summary && generatedPlan.tasks.length === 0) {
      return;
    }

    const invalidTask = generatedPlan.tasks.find((task) => {
      const errors = validateTask(task);
      return Object.keys(errors).length > 0;
    });

    if (invalidTask) {
      setReviewError(
        "Every task must include a title, description, and estimated time.",
      );
      return;
    }

    setReviewError("");

    await createDailyCheckIn(checkInValue);
    checkInTrackedRef.current = true;

    const user = await getCurrentUser();
    await saveAdaptiveDailyPlan(
      {
        summary: generatedPlan.summary,
        tasks: generatedPlan.tasks
          .filter((task) => task.title.trim() || task.description.trim())
          .map((task) => ({
            ...task,
            title: task.title.trim() || "Untitled task",
            description: task.description.trim(),
            estimated_minutes: Number(task.estimated_minutes) || 30,
            completed: Boolean(task.completed),
          })),
      },
      user.id,
    );

    void trackEvent("daily_check_in_completed", {
      date: getCurrentDateWithTimezoneOffset(),
    });

    setCurrentStep(1);
    router.replace({
      pathname: "/(tabs)",
      params: { dailyCheckInCompleted: "true", shouldShowIntro: "false" },
    });
  }

  if (isLoading) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#09090B" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <CheckInHeader
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
        />
        <View style={styles.content}>
          {currentStep === 1 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How did yesterday's plan feel?
              </Text>

              <ButtonGroup
                options={YESTERDAY_DIFFICULTY_OPTIONS}
                value={checkInValue?.yesterdayDifficulty}
                onChange={onDifficultyChange}
              />
            </View>
          )}

          {currentStep === 1.5 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>What was off about the plan?</Text>

              <TextField
                placeholder="Tell us what felt off about yesterday's plan"
                value={checkInValue.yesterdayDifficultyNote}
                onChangeText={(text) => {
                  setCheckInValue({
                    ...checkInValue,
                    yesterdayDifficultyNote: text,
                  });
                  if (difficultyNoteError) {
                    setDifficultyNoteError("");
                  }
                }}
                error={difficultyNoteError}
              />

              <View style={styles.actions}>
                <Button
                  label="Next"
                  type="primary"
                  onPress={continueFromDifficultyStep}
                />
              </View>
            </View>
          )}
          {currentStep === 2 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How much energy do you have today?
              </Text>

              <ButtonGroup
                options={ENERGY_SCALE}
                value={checkInValue?.energyScale}
                onChange={(value: EnergyScale) => {
                  setCheckInValue({
                    ...checkInValue,
                    energyScale: value,
                  });
                  setCurrentStep(3);
                }}
              />
            </View>
          )}
          {currentStep === 3 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                How much time do you realistically have today?
              </Text>

              <ButtonGroup
                options={AVAILABLE_TIME_OPTIONS}
                value={checkInValue?.availableTime}
                onChange={(value: AvailableTime) => {
                  setCheckInValue({
                    ...checkInValue,
                    availableTime: value,
                  });
                  setCurrentStep(4);
                }}
              />
            </View>
          )}
          {currentStep === 4 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                Is there anything that might affect your progress today?
                (optional)
              </Text>

              <TextField
                placeholder="Eg: sickness, travel, appointments"
                value={checkInValue.todaysImpediments}
                onChangeText={(text) => {
                  setCheckInValue({ ...checkInValue, todaysImpediments: text });
                }}
              />
              <View style={styles.actions}>
                <Button
                  label="Next"
                  type="primary"
                  onPress={() => submitCheckIn(checkInValue)}
                />
              </View>
            </View>
          )}

          {/* {currentStep === 5 && (
            <View style={styles.buttonGap}>
              <Text style={styles.stepTitle}>
                Any specific changes you would like to make?
              </Text>

              <Text style={styles.stepSubtitle}>
                Any tasks you'd like to add to today's plan? (optional)
              </Text>
              <TextField
                placeholder="Add tasks (comma-separated)"
                value={checkInValue.tasksToAdd || ""}
                onChangeText={(text) =>
                  setCheckInValue({ ...checkInValue, tasksToAdd: text })
                }
              />
              <Text style={styles.stepSubtitle}>
                Any tasks you'd like to remove from today's plan? (optional)
              </Text>
              <TextField
                placeholder="Remove tasks (comma-separated)"
                value={checkInValue.tasksToRemove || ""}
                onChangeText={(text) =>
                  setCheckInValue({ ...checkInValue, tasksToRemove: text })
                }
              />
              <View style={styles.actions}>
                <Button
                  label="Complete Check-in"
                  type="primary"
                  onPress={() => submitCheckIn(checkInValue)}
                />
              </View>
            </View>
          )} */}

          {currentStep === 6 && (
            <ScrollView
              contentContainerStyle={styles.reviewScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.stepTitle}>Review updated plan</Text>

              <View style={styles.reviewScrollContent}>
                <View style={styles.summaryCard}>
                  {/* <Text style={styles.cardLabel}>AI summary</Text> */}

                  <Text style={styles.stepSubtitle}>
                    {generatedPlan.summary}
                  </Text>
                </View>

                <View style={styles.reviewHeaderRow}>
                  <Text style={styles.stepSubtitle}>Checklist</Text>
                  <Button
                    label="Add task"
                    type="secondary"
                    onPress={addGeneratedTask}
                  />
                </View>

                {generatedPlan.tasks.map((task, index) => {
                  const isEditing = editingTaskIndex === index;

                  return (
                    <View
                      key={`task-card-${index}`}
                      style={styles.reviewTaskCard}
                    >
                      <View style={styles.taskCardHeader}>
                        <View style={styles.taskContentColumn}>
                          <Text style={styles.cardLabel}>
                            {task.title || "Untitled task"}
                          </Text>
                          {!isEditing && (
                            <>
                              <Text style={styles.taskSummaryDescription}>
                                {task.description || "No description added."}
                              </Text>
                              <Text style={styles.taskSummaryMeta}>
                                {task.estimated_minutes || 30} min
                              </Text>
                            </>
                          )}
                        </View>

                        <View style={styles.taskActionRow}>
                          <TouchableOpacity
                            onPress={() => {
                              if (isEditing) {
                                const errors = updateTaskError(index, task);
                                if (Object.keys(errors).length === 0) {
                                  setEditingTaskIndex(null);
                                }
                                return;
                              }

                              setEditingTaskIndex(index);
                            }}
                            style={styles.editTaskButton}
                          >
                            <Text style={styles.editTaskText}>
                              {isEditing ? "Done" : "Edit"}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => removeGeneratedTask(index)}
                            style={styles.removeTaskButton}
                          >
                            <Text style={styles.removeTaskText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {
                        isEditing && (
                          <View style={styles.taskEditor}>
                            <Text style={styles.fieldLabel}>Title</Text>
                            <TextField
                              placeholder="Task title"
                              value={task.title}
                              error={taskErrors[index]?.title}
                              onChangeText={(text) => {
                                const nextTask = { ...task, title: text };
                                updateTaskError(index, nextTask);
                                updateGeneratedTask(index, { title: text });
                              }}
                            />

                            <Text style={styles.fieldLabel}>Description</Text>
                            <TextField
                              placeholder="Task description"
                              value={task.description}
                              error={taskErrors[index]?.description}
                              onChangeText={(text) => {
                                const nextTask = { ...task, description: text };
                                updateTaskError(index, nextTask);
                                updateGeneratedTask(index, {
                                  description: text,
                                });
                              }}
                            />

                            <Text style={styles.fieldLabel}>
                              Estimated time (minutes)
                            </Text>
                            <TextField
                              placeholder="Minutes"
                              value={String(task.estimated_minutes ?? 30)}
                              error={taskErrors[index]?.estimated_minutes}
                              keyboardType="numeric"
                              onChangeText={(text) => {
                                const nextTask = {
                                  ...task,
                                  estimated_minutes: Number(text) || 0,
                                };
                                updateTaskError(index, nextTask);
                                updateGeneratedTask(index, {
                                  estimated_minutes: Number(text) || 0,
                                });
                              }}
                            />
                          </View>
                        )
                        // : (
                        //   <View style={styles.taskSummaryRow}>
                        //     <View style={styles.taskSummaryContent}>
                        //       <Text style={styles.taskSummaryTitle}>
                        //         {task.title || "Untitled task"}
                        //       </Text>
                        //       <Text style={styles.taskSummaryDescription}>
                        //         {task.description || "No description added."}
                        //       </Text>
                        //       <Text style={styles.taskSummaryFrequency}>
                        //         {task.description ? "" : ""}
                        //       </Text>
                        //     </View>
                        //     <Text style={styles.taskSummaryMeta}>
                        //       {task.estimated_minutes || 30} min
                        //     </Text>
                        //   </View>
                        // )
                      }
                    </View>
                  );
                })}

                {reviewError ? (
                  <Text style={styles.errorText}>{reviewError}</Text>
                ) : null}

                <View style={styles.actions}>
                  <Button
                    label="Save plan"
                    type="primary"
                    onPress={saveReviewedPlan}
                  />
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CheckInHeader({
  currentStep,
  setCurrentStep,
}: {
  currentStep: StepType;
  setCurrentStep: (value: StepType) => void;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const handleBack = () => {
    if (currentStep === 6) {
      setCurrentStep(5 as StepType);
      return;
    }

    if (currentStep === 1.5) {
      setCurrentStep(1 as StepType);
      return;
    }

    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as StepType);
      return;
    }

    router.back();
  };
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleBack}>
        <MaterialCommunityIcons
          name="chevron-left"
          color={colors.text}
          size={40}
        />
      </TouchableOpacity>

      <View style={styles.progressChunkContainer}>
        <ProgressChunk completed={currentStep >= 1} />
        <ProgressChunk completed={currentStep >= 2} />
        <ProgressChunk completed={currentStep >= 3} />
        <ProgressChunk completed={currentStep >= 4} />
        <ProgressChunk completed={currentStep >= 5} />
      </View>
    </View>
  );
}

function ProgressChunk({ completed = false }: { completed?: boolean }) {
  return (
    <View style={[styles.progressChunk, completed && styles.completed]}></View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressChunk: {
    height: 5,
    width: "17%",
    borderRadius: 10,
    backgroundColor: "#A1A1AA",
  },
  completed: {
    backgroundColor: "#F5F5F5",
  },
  progressChunkContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#ecedee",
    marginBottom: 8,
    textAlign: "center",
  },
  buttonGap: {
    gap: 10,
  },
  reviewContainer: {
    flex: 1,
  },
  reviewScrollContent: {
    paddingBottom: 32,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryCard: {
    padding: 12,
    marginBottom: 12,
  },
  cardLabel: {
    color: "#ecedee",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  fieldLabel: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  reviewTaskCard: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  taskCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
    gap: 12,
  },
  taskContentColumn: {
    flex: 1,
    gap: 4,
  },
  taskActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editTaskButton: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editTaskText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  removeTaskButton: {
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.6)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeTaskText: {
    color: "#fca5a5",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  taskSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    gap: 12,
  },
  taskSummaryContent: {
    flex: 1,
    gap: 2,
  },
  taskSummaryTitle: {
    color: "#ecedee",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  taskSummaryDescription: {
    color: "#d4d4d8",
    fontSize: 12,
    lineHeight: 18,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  taskSummaryMeta: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  taskEditor: {
    gap: 4,
  },
  actions: {
    marginTop: 24,
  },
});
