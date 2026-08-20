describe("analytics deduplication", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const setNodeEnv = (value: string | undefined) => {
    Object.defineProperty(process.env, "NODE_ENV", {
      configurable: true,
      value,
    });
  };

  beforeEach(() => {
    jest.resetModules();
    setNodeEnv("production");
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
  });

  it("deduplicates app_opened within a session", async () => {
    const insert = jest.fn().mockResolvedValue({ data: null, error: null });

    jest.doMock("@/lib/supabase", () => ({
      supabase: {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
        },
        from: jest.fn(() => ({ insert })),
      },
    }));

    const { trackEvent } = require("@/lib/analytics");

    await trackEvent("app_opened");
    await trackEvent("app_opened");

    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("does not send analytics from a local build", async () => {
    const insert = jest.fn().mockResolvedValue({ data: null, error: null });

    jest.doMock("@/lib/supabase", () => ({
      supabase: {
        auth: {
          getUser: jest.fn(),
        },
        from: jest.fn(() => ({ insert })),
      },
    }));

    setNodeEnv("development");
    const { trackEvent } = require("@/lib/analytics");

    await trackEvent("app_opened");

    expect(insert).not.toHaveBeenCalled();
  });

  it("deduplicates the same daily completion event for a user on the same date", async () => {
    const insert = jest.fn().mockResolvedValue({ data: null, error: null });

    jest.doMock("@/lib/supabase", () => ({
      supabase: {
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-456" } },
            error: null,
          }),
        },
        from: jest.fn(() => ({ insert })),
      },
    }));

    const { trackEvent } = require("@/lib/analytics");
    const today = new Date().toISOString().slice(0, 10);

    await trackEvent("daily_plan_completed", { date: today }, "user-456");
    await trackEvent("daily_plan_completed", { date: today }, "user-456");

    expect(insert).toHaveBeenCalledTimes(1);
  });
});
