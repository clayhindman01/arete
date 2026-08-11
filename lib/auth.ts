import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { logEvent } from "./analytics";
import { supabase } from "./supabase";

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  // non-blocking analytics
  void logEvent(
    "sign_up_completed",
    { email: String(email) },
    data?.user?.id ?? null,
  );
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const redirectTo =
    process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/ResetPassword`
      : "arete://reset-password");

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw error;
  return data.user;
}

type Profile = {
  id: string;
  username?: string;
  onboarding_complete: boolean;
};

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user)
      .single();

    if (!error) {
      setProfile(data);
    }
  }

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(async ({ data }) => {
      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      }

      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    profile,
    loading,
  };
}
