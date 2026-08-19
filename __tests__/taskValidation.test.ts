import { validateTask } from "@/lib/taskValidation";

describe("task validation", () => {
  it("requires a title, description, and estimated time for a task", () => {
    expect(
      validateTask({
        title: "",
        description: "",
        estimated_minutes: 0,
      }),
    ).toEqual({
      title: "Title is required",
      description: "Description is required",
      estimated_minutes: "Estimated time is required",
    });
  });

  it("accepts a complete task", () => {
    expect(
      validateTask({
        title: "Walk 10 minutes",
        description: "A brisk walk outside",
        estimated_minutes: 15,
      }),
    ).toEqual({});
  });
});
