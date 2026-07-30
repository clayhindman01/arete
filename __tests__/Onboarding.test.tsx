import React from "react";

import { generatePlan } from "@/lib/ai";

jest.mock("@/lib/ai", () => ({
  generatePlan: jest.fn(),
}));

const mockedGeneratePlan = generatePlan as jest.Mock;

describe("Onboarding plan generation", () => {
  beforeEach(() => {
    mockedGeneratePlan.mockResolvedValue({
      text: JSON.stringify({
        goal: { title: "Test Goal", description: "Test description" },
        commitments: [],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("passes the selected available time to plan generation", async () => {
    const formData = {
      name: "Alex",
      goal: "Run a 5k",
      goalTimeline: "30days",
      startingPoint: "I can walk for 20 minutes most days",
      availableTime: "15to30",
    };

    await generatePlan(formData);

    expect(mockedGeneratePlan).toHaveBeenCalledWith(formData);
    expect(mockedGeneratePlan.mock.calls[0][0].availableTime).toBe("15to30");
  });
});
