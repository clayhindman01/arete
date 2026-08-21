"use client";

import { getProfile } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Profile as BaseProfile } from "@/types/profile";
import { Session, User } from "@supabase/supabase-js";
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

export type UserProfile = BaseProfile & {
  onboarding_complete?: boolean;
};

type ProfileContextValue = {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AUTH_REQUEST_TIMEOUT_MS = 15_000;
const SIMULATE_AUTH_FAILURE =
  __DEV__ && process.env.EXPO_PUBLIC_SIMULATE_AUTH_FAILURE === "true";

function withAuthTimeout<T>(request: PromiseLike<T>): Promise<T> {
  if (SIMULATE_AUTH_FAILURE) {
    request = new Promise<T>(() => undefined);
  }

  let timeoutId: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error("Authentication request timed out")),
      AUTH_REQUEST_TIMEOUT_MS,
    );
  });

  return Promise.race([request, timeout]).finally(() =>
    clearTimeout(timeoutId),
  );
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const loadedProfile = await withAuthTimeout(getProfile());
      setProfile(loadedProfile as UserProfile);
    } catch (error) {
      console.error("Unable to load profile:", error);
      setProfile(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setLoading(true);

      try {
        const { data } = await withAuthTimeout(supabase.auth.getSession());
        if (!mounted) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Unable to initialize session:", error);
        if (!mounted) return;

        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);
        setProfile(null);

        if (session?.user) {
          setTimeout(() => {
            if (mounted) {
              void refreshProfile().catch(() => undefined);
            }
          }, 0);
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const value = useMemo(
    () => ({ user, session, profile, loading, refreshProfile }),
    [user, session, profile, loading, refreshProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
