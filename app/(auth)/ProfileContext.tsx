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
      const loadedProfile = await getProfile();
      setProfile(loadedProfile as UserProfile);
    } catch (error) {
      console.error("Unable to load profile:", error);
      setProfile(null);
      throw error;
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const currentSession = data.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await refreshProfile();
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    initialize();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await refreshProfile();
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
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
