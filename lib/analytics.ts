import { supabase } from "./supabase";

export type AnalyticsProps = Record<string, unknown> | null;

export async function logEvent(
  event_name: string,
  properties: AnalyticsProps = null,
  user_id: string | null = null,
) {
  try {
    let uid = user_id;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data?.user?.id ?? null;
    }

    await supabase.from("analytics_events").insert([
      {
        event_name,
        properties,
        user_id: uid,
      },
    ]);
  } catch (e) {
    // non-blocking telemetry: warn but don't block UX
    // eslint-disable-next-line no-console
    console.warn("logEvent failed", e);
  }
}
