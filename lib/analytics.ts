import { supabase } from "./supabase";

export type AnalyticsProps = Record<string, unknown> | null;

const dedupTracker = new Set<string>();

function getDedupKey(
  event_name: string,
  user_id: string | null,
  properties: AnalyticsProps,
) {
  if (event_name === "app_opened") {
    return `${event_name}:${user_id ?? "anonymous"}:session`;
  }

  const date =
    typeof properties?.date === "string"
      ? properties.date
      : new Date().toISOString().slice(0, 10);

  if (
    event_name === "daily_plan_completed" ||
    event_name === "daily_check_in_completed"
  ) {
    return `${event_name}:${user_id ?? "anonymous"}:${date}`;
  }

  return `${event_name}:${user_id ?? "anonymous"}:${JSON.stringify(properties ?? {})}`;
}

export async function getCurrentUserId() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      return null;
    }

    return user.id;
  } catch {
    return null;
  }
}

export async function trackEvent(
  event_name: string,
  properties: AnalyticsProps = null,
  user_id: string | null = null,
) {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    const uid = user_id ?? (await getCurrentUserId());
    const dedupKey = getDedupKey(event_name, uid, properties);

    if (dedupTracker.has(dedupKey)) {
      return;
    }

    dedupTracker.add(dedupKey);

    const { error } = await supabase.from("analytics_events").insert([
      {
        event_name,
        properties,
        user_id: uid,
      },
    ]);

    if (error) {
      throw error;
    }
  } catch (e) {
    // non-blocking telemetry: warn but don't block UX
    // eslint-disable-next-line no-console
    console.warn("logEvent failed", e);
  }
}

export const logEvent = trackEvent;
