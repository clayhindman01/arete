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

export async function deleteAccount() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("No authenticated user found.");

  try {
    const { data, error } = await supabase.functions.invoke("delete-account");

    if (error) {
      const response =
        "context" in error && error.context ? error.context : null;

      if (response && typeof response === "object" && "json" in response) {
        try {
          const payload = await response.clone().json();
          if (payload && typeof payload === "object" && "error" in payload) {
            throw new Error(String(payload.error));
          }
        } catch {
          // Fall through to the original Supabase error object when no JSON payload is available.
        }
      }

      throw error;
    }
  } catch (err: any) {
    const resp = err?.response || err?.context || err?.cause?.response || null;
    if (resp && typeof resp.json === "function") {
      try {
        const payload = await resp.json();
        if (payload && typeof payload === "object" && "error" in payload) {
          throw new Error(String(payload.error));
        }
      } catch {
        try {
          const text = await resp.text();
          throw new Error(`Edge function error: ${text}`);
        } catch {
          // fallthrough
        }
      }
    }

    throw err;
  }

  try {
    await signOut();
  } catch {
    // Account deletion already invalidates the session; ignore cleanup errors.
  }
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

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const { data, error } = await withAuthTimeout(
      supabase.from("profiles").select("*").eq("id", userId).single(),
    );

    if (error) {
      console.error("Failed to load profile:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  }

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const {
          data: { session },
        } = await withAuthTimeout(supabase.auth.getSession());

        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
        if (mounted) {
          setSession(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setSession(session);
      setProfile(null);

      if (session?.user) {
        // Do not await Supabase calls inside the auth callback. Supabase holds
        // an internal lock while notifying listeners.
        setTimeout(() => {
          if (mounted) void loadProfile(session.user.id);
        }, 0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    profile,
    loading,
  };
}
