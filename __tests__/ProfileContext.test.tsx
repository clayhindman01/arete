import { act, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";

import { ProfileProvider, useProfile } from "@/app/(auth)/ProfileContext";
import { getProfile } from "@/lib/db";
import { supabase } from "@/lib/supabase";

type MockSupabaseAuth = {
  getSession: jest.Mock;
  onAuthStateChange: jest.Mock;
};

jest.mock("@/lib/supabase", () => {
  const getSession = jest.fn();
  const onAuthStateChange = jest.fn();

  return {
    supabase: {
      auth: {
        getSession,
        onAuthStateChange,
      },
    },
  };
});

jest.mock("@/lib/db", () => ({
  getProfile: jest.fn(),
}));

const mockedSupabase = supabase as unknown as { auth: MockSupabaseAuth };
const mockedGetProfile = getProfile as jest.Mock;

const TestConsumer = () => {
  const { user, session, profile, loading } = useProfile();
  return (
    <Text testID="consumer">
      {JSON.stringify({ user, session, profile, loading })}
    </Text>
  );
};

describe("ProfileContext", () => {
  const user = { id: "user-1", email: "test@example.com" };
  const profile = {
    id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
    name: "Test User",
    age: null,
    height_cm: null,
    weight_kg: null,
    fitness_goal: null,
    activity_level: null,
    onboarding_complete: true,
  };

  beforeEach(() => {
    mockedSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user } },
    });
    mockedSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockedGetProfile.mockResolvedValue(profile);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("throws when useProfile is used outside ProfileProvider", () => {
    const BrokenConsumer = () => {
      useProfile();
      return null;
    };

    expect(() => render(<BrokenConsumer />)).toThrow(
      "useProfile must be used within a ProfileProvider",
    );
  });

  it("loads session and profile and exposes them to consumers", async () => {
    const { getByTestId } = render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>,
    );

    await waitFor(() => {
      const content = getByTestId("consumer").props.children;
      const values = JSON.parse(content);
      expect(values.loading).toBe(false);
      expect(values.user.id).toBe("user-1");
      expect(values.profile.id).toBe("user-1");
    });

    expect(mockedGetProfile).toHaveBeenCalledTimes(1);
  });

  it("refreshProfile reloads the profile", async () => {
    let refreshProfileFn: (() => Promise<void>) | null = null;

    const RefreshConsumer = () => {
      const { refreshProfile } = useProfile();
      refreshProfileFn = refreshProfile;
      return <Text testID="refresh" />;
    };

    const updatedProfile = {
      ...profile,
      name: "Updated User",
      age: 30,
      height_cm: 175,
      weight_kg: 70,
    };

    mockedGetProfile
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(updatedProfile);

    const { getByTestId } = render(
      <ProfileProvider>
        <RefreshConsumer />
        <TestConsumer />
      </ProfileProvider>,
    );

    await waitFor(() => {
      expect(refreshProfileFn).not.toBeNull();
    });

    await act(async () => {
      await refreshProfileFn!();
    });

    await waitFor(() => {
      const content = getByTestId("consumer").props.children;
      const values = JSON.parse(content);
      expect(values.profile.name).toBe("Updated User");
      expect(values.profile.age).toBe(30);
    });

    expect(mockedGetProfile).toHaveBeenCalledTimes(2);
  });
});
