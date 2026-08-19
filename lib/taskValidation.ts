export type TaskValidationErrors = Partial<{
  title: string;
  description: string;
  estimated_minutes: string;
}>;

export function validateTask(task: {
  title?: string;
  description?: string;
  estimated_minutes?: number | string | null;
}): TaskValidationErrors {
  const errors: TaskValidationErrors = {};

  if (!task.title || !task.title.trim()) {
    errors.title = "Title is required";
  }

  if (!task.description || !task.description.trim()) {
    errors.description = "Description is required";
  }

  const estimatedMinutes = Number(task.estimated_minutes);
  if (
    task.estimated_minutes === undefined ||
    task.estimated_minutes === null ||
    Number.isNaN(estimatedMinutes) ||
    estimatedMinutes <= 0
  ) {
    errors.estimated_minutes = "Estimated time is required";
  }

  return errors;
}
