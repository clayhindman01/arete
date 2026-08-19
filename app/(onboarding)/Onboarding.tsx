import Button from "@/components/ui/Button";
import ButtonGroup from "@/components/ui/ButtonGroup";
import Loader from "@/components/ui/Loader";
import TextField from "@/components/ui/TextField";
import { generatePlan } from "@/lib/ai";
import { logEvent } from "@/lib/analytics";
import { completeOnboarding, saveGeneratedPlan } from "@/lib/db";
import { useProfile } from "@/lib/ProfileContext";
import { TaskValidationErrors, validateTask } from "@/lib/taskValidation";
import type {
  AvailableTime,
  GoalTimeline,
  OnboardingData,
} from "@/types/onboarding";
import {
  AVAILABLE_TIME_OPTIONS,
  GOAL_TIMELINE_OPTIONS,
} from "@/types/onboarding";
import { Commitments, PlanGeneration } from "@/types/PlanGeneration";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const router = useRouter();
  const { profile, refreshProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(2);
  const [planData, setPlanData] = useState<PlanGeneration>();
  const [formData, setFormData] = useState<OnboardingData>({
    name: "",
    goal: "",
    goalTimeline: null,
    startingPoint: "",
    availableTime: null,
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof OnboardingData, string>>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<number, boolean[][]>>({});
  const [editingTaskKey, setEditingTaskKey] = useState<string | null>(null);
  const [taskErrors, setTaskErrors] = useState<
    Record<string, TaskValidationErrors>
  >({});

  const synchronizeSelections = (nextPlan: PlanGeneration) => {
    setSelections((prev) => {
      const next: Record<number, boolean[][]> = {};

      nextPlan.commitments.forEach((commitment, commitmentIndex) => {
        next[commitmentIndex] = commitment.routines.map(
          (routine, routineIndex) => {
            const previousRow = prev[commitmentIndex]?.[routineIndex] ?? [];
            return routine.tasks.map(
              (_, taskIndex) => previousRow[taskIndex] ?? true,
            );
          },
        );
      });

      return next;
    });
  };

  const updatePlanTask = (
    commitmentIndex: number,
    routineIndex: number,
    taskIndex: number,
    updates: Partial<Commitments["routines"][number]["tasks"][number]>,
  ) => {
    setPlanData((previousPlan) => {
      if (!previousPlan) return previousPlan;

      const nextPlan: PlanGeneration = {
        ...previousPlan,
        commitments: previousPlan.commitments.map((commitment, ci) =>
          ci !== commitmentIndex
            ? commitment
            : {
                ...commitment,
                routines: commitment.routines.map((routine, ri) =>
                  ri !== routineIndex
                    ? routine
                    : {
                        ...routine,
                        tasks: routine.tasks.map((task, ti) =>
                          ti !== taskIndex ? task : { ...task, ...updates },
                        ),
                      },
                ),
              },
        ),
      };

      synchronizeSelections(nextPlan);
      return nextPlan;
    });
  };

  const addPlanTask = (commitmentIndex: number, routineIndex: number) => {
    setPlanData((previousPlan) => {
      if (!previousPlan) return previousPlan;

      const nextPlan: PlanGeneration = {
        ...previousPlan,
        commitments: previousPlan.commitments.map((commitment, ci) =>
          ci !== commitmentIndex
            ? commitment
            : {
                ...commitment,
                routines: commitment.routines.map((routine, ri) =>
                  ri !== routineIndex
                    ? routine
                    : {
                        ...routine,
                        tasks: [
                          ...routine.tasks,
                          {
                            id: undefined,
                            title: "",
                            description: "",
                            estimated_minutes: 30,
                            one_word_description: "",
                            completed: false,
                          },
                        ],
                      },
                ),
              },
        ),
      };

      const taskCount =
        nextPlan.commitments[commitmentIndex].routines[routineIndex].tasks
          .length;
      const nextTaskKey = `${commitmentIndex}-${routineIndex}-${taskCount - 1}`;
      const nextTask =
        nextPlan.commitments[commitmentIndex].routines[routineIndex].tasks[
          taskCount - 1
        ];

      setEditingTaskKey(nextTaskKey);
      setTaskErrors((previous) => ({
        ...previous,
        [nextTaskKey]: validateTask(nextTask),
      }));
      synchronizeSelections(nextPlan);
      return nextPlan;
    });
  };

  const removePlanTask = (
    commitmentIndex: number,
    routineIndex: number,
    taskIndex: number,
  ) => {
    setPlanData((previousPlan) => {
      if (!previousPlan) return previousPlan;

      const nextPlan: PlanGeneration = {
        ...previousPlan,
        commitments: previousPlan.commitments.map((commitment, ci) =>
          ci !== commitmentIndex
            ? commitment
            : {
                ...commitment,
                routines: commitment.routines.map((routine, ri) =>
                  ri !== routineIndex
                    ? routine
                    : {
                        ...routine,
                        tasks: routine.tasks.filter(
                          (_, ti) => ti !== taskIndex,
                        ),
                      },
                ),
              },
        ),
      };

      synchronizeSelections(nextPlan);
      return nextPlan;
    });

    if (editingTaskKey === `${commitmentIndex}-${routineIndex}-${taskIndex}`) {
      setEditingTaskKey(null);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: typeof errors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          newErrors.name = "Name is required";
        }
        break;
      case 2:
        if (!formData.goal.trim()) {
          newErrors.goal = "Goal is required";
        }
        break;
      case 4:
        if (!formData.startingPoint.trim()) {
          newErrors.startingPoint = "Starting point is required";
        }
        break;
      case 3:
        break;
      case 5:
        break;
      case 6:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5 | 6);
      setErrors({});
    }
  };

  const handleSelectOption = (
    step: 1 | 2 | 3 | 4 | 5 | 6,
    nextFormData: OnboardingData = formData,
  ) => {
    if (validateStep(step)) {
      if (step < 5) {
        setCurrentStep((step + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        setErrors({});
      } else {
        handleGeneratePlan(nextFormData);
      }
    }
  };

  const formatDays = (days: string[]) => {
    if (days.length === 0) return "";
    if (days.length === 1) return days[0];
    return `${days.slice(0, -1).join(", ")} and ${days.slice(-1)[0]}`;
  };

  const getDayOfWeekValues = (days: string[]) => {
    const formattedDays: string[] = [];
    for (const day of days) {
      switch (day) {
        case "M":
          formattedDays.push("Monday");
          break;
        case "T":
          formattedDays.push("Tuesday");
          break;
        case "W":
          formattedDays.push("Wednesday");
          break;
        case "Th":
          formattedDays.push("Thursday");
          break;
        case "F":
          formattedDays.push("Friday");
          break;
        case "S":
          formattedDays.push("Saturday");
          break;
        case "Su":
          formattedDays.push("Sunday");
          break;
      }
    }
    return formattedDays;
  };

  const formatRoutineFrequency = (routine: any) => {
    if (routine.frequency === "daily") {
      return "Daily";
    }

    const days = getDayOfWeekValues(routine.days_of_week || []);
    return `Weekly on ${formatDays(days)}`;
  };

  const updateTaskErrors = (taskKey: string, task: any) => {
    const nextErrors = validateTask(task);
    setTaskErrors((previous) => ({
      ...previous,
      [taskKey]: nextErrors,
    }));
    return nextErrors;
  };

  const handleGeneratePlan = async (data: OnboardingData = formData) => {
    setCurrentStep(6);
    console.log("Onboarding data:", data);

    const res = await generatePlan(data);
    const parsedPlan = JSON.parse(res.text);
    setPlanData(parsedPlan);
    console.log("Plan", parsedPlan);
    // non-blocking analytics
    void logEvent(
      "plan_generated",
      {
        goal_title: parsedPlan?.goal?.title ?? null,
      },
      profile?.id ?? null,
    );
  };

  const handleComplete = () => {
    if (!profile || !planData) return;

    // compute total selected tasks from selections (fallback to all selected)
    const totalSelectedTasks = planData.commitments.reduce((acc, c, ci) => {
      const selForCommitment = selections[ci];
      if (!selForCommitment) {
        return (
          acc +
          c.routines.reduce((a, r) => a + (r.tasks ? r.tasks.length : 0), 0)
        );
      }
      const count = selForCommitment.reduce(
        (ra, row) => ra + row.filter(Boolean).length,
        0,
      );
      return acc + count;
    }, 0);

    if (totalSelectedTasks === 0) {
      setSubmitError("Please select at least one task to create a plan");
      return;
    }

    setIsLoading(true);

    // Build filtered plan using selections
    const filteredPlan: PlanGeneration = {
      ...planData,
      commitments: planData.commitments
        .map((c, ci) => {
          const selForCommitment = selections[ci];
          if (!selForCommitment) return c;
          const routines = c.routines
            .map((r, ri) => {
              const taskSelectionRow =
                selForCommitment[ri] ?? r.tasks.map(() => true);
              const tasks = r.tasks.filter((t, ti) => taskSelectionRow[ti]);
              return { ...r, tasks };
            })
            .filter((r) => r.tasks && r.tasks.length > 0);
          return { ...c, routines } as Commitments;
        })
        .filter((c) => c.routines && c.routines.length > 0),
    };

    const hasInvalidTask = filteredPlan.commitments.some((commitment) =>
      commitment.routines.some((routine) =>
        routine.tasks.some((task) => {
          const errors = validateTask(task);
          return Object.keys(errors).length > 0;
        }),
      ),
    );

    if (hasInvalidTask) {
      setSubmitError(
        "Every task must include a title, description, and estimated time.",
      );
      setIsLoading(false);
      return;
    }

    saveGeneratedPlan(profile.id, filteredPlan).then(() => {
      completeOnboarding().then(async () => {
        // non-blocking analytics
        void logEvent(
          "onboarding_completed",
          { plan_created: true },
          profile.id,
        );
        await refreshProfile();
        router.replace("/(paywall)");
      });
    });
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: "#09090B" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {currentStep != 6 && (
          <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />
        )}
        {/* <ScrollView
          contentContainerStyle={styles.content}
          scrollEnabled={currentStep === 6}
        > */}
        {currentStep === 1 && (
          <View>
            <Text style={styles.stepTitle}>What should I call you?</Text>
            <TextField
              placeholder="Enter your name"
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: undefined });
              }}
              error={errors.name}
            />
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Text style={styles.stepTitle}>
              WHAT IS A GOAL YOU'D LIKE TO MAKE PROGRESS ON?
            </Text>
            <TextField
              placeholder="Describe your goal"
              value={formData.goal}
              onChangeText={(text) => {
                setFormData({ ...formData, goal: text });
                if (errors.goal) setErrors({ ...errors, goal: undefined });
              }}
              error={errors.goal}
            />
          </View>
        )}

        {currentStep === 3 && (
          <View>
            <Text style={styles.stepTitle}>
              IS THERE A TIMELINE FOR ACHIEVING YOUR GOAL?
            </Text>
            <ButtonGroup
              options={GOAL_TIMELINE_OPTIONS}
              value={formData.goalTimeline}
              onChange={(value: GoalTimeline) => {
                const nextFormData = { ...formData, goalTimeline: value };
                setFormData(nextFormData);
                handleSelectOption(3, nextFormData);
              }}
            />
            {errors.goalTimeline && (
              <Text style={styles.errorText}>{errors.goalTimeline}</Text>
            )}
          </View>
        )}

        {currentStep === 4 && (
          <View>
            <Text style={styles.stepTitle}>
              DESCRIBE YOUR CURRENT PROGRESS ON THIS GOAL
            </Text>
            <Text style={styles.subText}>
              (The more details you include the more accurate your plan will be)
            </Text>
            <TextField
              placeholder="Describe your current situation"
              value={formData.startingPoint}
              onChangeText={(text) => {
                setFormData({ ...formData, startingPoint: text });
                if (errors.startingPoint)
                  setErrors({ ...errors, startingPoint: undefined });
              }}
              error={errors.startingPoint}
            />
          </View>
        )}

        {currentStep === 5 && (
          <View>
            <Text style={styles.stepTitle}>
              HOW MUCH TIME DAILY DO YOU HAVE AVAILABLE?
            </Text>
            <ButtonGroup
              options={AVAILABLE_TIME_OPTIONS}
              value={formData.availableTime}
              onChange={(value: AvailableTime) => {
                const nextFormData = { ...formData, availableTime: value };
                setFormData(nextFormData);
                handleSelectOption(5, nextFormData);
              }}
            />
            {errors.availableTime && (
              <Text style={styles.errorText}>{errors.availableTime}</Text>
            )}
          </View>
        )}

        {currentStep === 6 &&
          (planData ? (
            <View style={styles.reviewContainer}>
              <Text style={styles.stepTitle}>EDIT PLAN</Text>
              <Text style={styles.goalText}>
                Review your suggestions and make any edits before creating the
                plan.
              </Text>
              <Text style={styles.subText}>
                This is your plan, so make it work for you!
              </Text>

              <ScrollView
                contentContainerStyle={styles.reviewScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {planData.commitments.map((commitment, commitmentIndex) => (
                  <View
                    key={`commitment-${commitmentIndex}`}
                    style={styles.commitmentCard}
                  >
                    <Text style={styles.commitmentTitle}>
                      {commitment.title}
                    </Text>

                    {commitment.routines.map((routine, routineIndex) => (
                      <View
                        key={`routine-${routineIndex}`}
                        style={styles.routineCard}
                      >
                        <View style={styles.reviewHeaderRow}>
                          <Text style={styles.routineTitle}>
                            {routine.title}
                          </Text>
                          <Button
                            label="Add task"
                            type="secondary"
                            onPress={() =>
                              addPlanTask(commitmentIndex, routineIndex)
                            }
                          />
                        </View>

                        {routine.tasks.map((task, taskIndex) => {
                          const taskKey = `${commitmentIndex}-${routineIndex}-${taskIndex}`;
                          const isEditing = editingTaskKey === taskKey;

                          return (
                            <View key={taskKey} style={styles.reviewTaskCard}>
                              <View style={styles.taskCardHeader}>
                                <View style={styles.taskContentColumn}>
                                  <Text style={styles.cardLabel}>
                                    {task.title || "Untitled task"}
                                  </Text>
                                  {isEditing ? null : (
                                    <>
                                      <Text
                                        style={styles.taskSummaryDescription}
                                      >
                                        {task.description ||
                                          "No description added."}
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
                                        const errors = updateTaskErrors(
                                          taskKey,
                                          task,
                                        );
                                        if (Object.keys(errors).length === 0) {
                                          setEditingTaskKey(null);
                                        }
                                        return;
                                      }

                                      setEditingTaskKey(taskKey);
                                    }}
                                    style={styles.editTaskButton}
                                  >
                                    <Text style={styles.editTaskText}>
                                      {isEditing ? "Done" : "Edit"}
                                    </Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() =>
                                      removePlanTask(
                                        commitmentIndex,
                                        routineIndex,
                                        taskIndex,
                                      )
                                    }
                                    style={styles.removeTaskButton}
                                  >
                                    <Text style={styles.removeTaskText}>
                                      Remove
                                    </Text>
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
                                      error={taskErrors[taskKey]?.title}
                                      onChangeText={(text) => {
                                        const nextTask = {
                                          ...task,
                                          title: text,
                                        };
                                        updateTaskErrors(taskKey, nextTask);
                                        updatePlanTask(
                                          commitmentIndex,
                                          routineIndex,
                                          taskIndex,
                                          { title: text },
                                        );
                                      }}
                                    />

                                    <Text style={styles.fieldLabel}>
                                      Description
                                    </Text>
                                    <TextField
                                      placeholder="Task description"
                                      value={task.description}
                                      error={taskErrors[taskKey]?.description}
                                      onChangeText={(text) => {
                                        const nextTask = {
                                          ...task,
                                          description: text,
                                        };
                                        updateTaskErrors(taskKey, nextTask);
                                        updatePlanTask(
                                          commitmentIndex,
                                          routineIndex,
                                          taskIndex,
                                          { description: text },
                                        );
                                      }}
                                    />

                                    <Text style={styles.fieldLabel}>
                                      Estimated time
                                    </Text>
                                    <TextField
                                      placeholder="Minutes"
                                      value={String(
                                        task.estimated_minutes ?? 30,
                                      )}
                                      error={
                                        taskErrors[taskKey]?.estimated_minutes
                                      }
                                      keyboardType="numeric"
                                      onChangeText={(text) => {
                                        const nextMinutes = Number(text) || 0;
                                        const nextTask = {
                                          ...task,
                                          estimated_minutes: nextMinutes,
                                        };
                                        updateTaskErrors(taskKey, nextTask);
                                        updatePlanTask(
                                          commitmentIndex,
                                          routineIndex,
                                          taskIndex,
                                          {
                                            estimated_minutes: nextMinutes,
                                          },
                                        );
                                      }}
                                    />

                                    <Text style={styles.fieldLabel}>
                                      Frequency
                                    </Text>
                                    <Text style={styles.taskFrequencyValue}>
                                      {formatRoutineFrequency(routine)}
                                    </Text>
                                  </View>
                                )
                                // : (
                                //   <View style={styles.taskSummaryRow}>
                                //     <View style={styles.taskSummaryContent}>
                                //       <Text style={styles.taskSummaryTitle}>
                                //         {task.title || "Untitled task"}
                                //       </Text>
                                //       <Text
                                //         style={styles.taskSummaryDescription}
                                //       >
                                //         {task.description ||
                                //           "No description added."}
                                //       </Text>
                                //       <Text style={styles.taskSummaryFrequency}>
                                //         {formatRoutineFrequency(routine)}
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
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <>
              <Text style={styles.stepTitle}>Creating Plan</Text>
              <ActivityIndicator size="large" color="white" />
            </>
          ))}

        {(currentStep === 1 || currentStep === 2 || currentStep === 4) && (
          <View style={styles.actions}>
            <Button label="Next" type="primary" onPress={handleNext} />
          </View>
        )}
        {currentStep === 6 && planData && (
          <View style={styles.actions}>
            {submitError && <Text style={styles.errorText}>{submitError}</Text>}
            <Button
              label="Create Plan"
              type="primary"
              onPress={() => {
                setSubmitError(null);
                handleComplete();
              }}
              disabled={
                planData.commitments.reduce((acc, c, ci) => {
                  const selForCommitment = selections[ci];
                  if (!selForCommitment) {
                    return (
                      acc +
                      c.routines.reduce(
                        (a, r) => a + (r.tasks ? r.tasks.length : 0),
                        0,
                      )
                    );
                  }
                  const count = selForCommitment.reduce(
                    (ra, row) => ra + row.filter(Boolean).length,
                    0,
                  );
                  return acc + count;
                }, 0) === 0
              }
            />
          </View>
        )}
        {/* </ScrollView> */}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({
  currentStep,
  setCurrentStep,
}: {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  setCurrentStep: (value: 1 | 2 | 3 | 4 | 5 | 6) => void;
}) {
  const { colors } = useTheme();
  const handleBack = () => {
    setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5 | 6);
  };
  return (
    <View style={styles.header}>
      {currentStep != 2 && (
        <TouchableOpacity
          onPress={handleBack}
          style={{ position: "absolute", left: 0, paddingTop: 10 }}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            color={colors.text}
            size={50}
          />
        </TouchableOpacity>
      )}

      <View style={styles.progressChunkContainer}>
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
  reviewContainer: {
    flex: 1,
  },
  reviewScrollContent: {
    paddingBottom: 36,
  },
  commitmentCard: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
  },
  commitmentTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ecedee",
    marginBottom: 12,
  },
  routineCard: {
    marginBottom: 12,
  },
  routineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#a1a1aa",
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewTaskCard: {
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
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
    gap: 8,
  },
  taskEditor: {
    gap: 4,
  },
  fieldLabel: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  cardLabel: {
    color: "#ecedee",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 2,
    textTransform: "uppercase",
    flexShrink: 1,
    flexWrap: "wrap",
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
  taskSummaryFrequency: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  taskSummaryMeta: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  taskFrequencyValue: {
    color: "#ecedee",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  card: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: 1,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
  },
  goalText: {
    fontSize: 16,
    textAlign: "center",
    color: "#ecedee",
    fontWeight: "600",
    marginTop: -18,
    marginBottom: 24,
  },
  subText: {
    fontSize: 14,
    textAlign: "center",
    color: "#ecedee",
    marginBottom: 24,
    marginTop: -18,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    marginTop: 24,
  },
  progressChunk: {
    height: 5,
    width: "20%",
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
  header: {
    flexDirection: "row",
    paddingTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
