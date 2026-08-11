import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase configuration." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const cleanupTables = [
      { table: "analytics_events", column: "user_id" },
      { table: "check_ins", column: "user_id" },
      { table: "ai_messages", column: "user_id" },
      { table: "ai_plans", column: "user_id" },
      { table: "commitments", column: "user_id" },
      { table: "routines", column: "user_id" },
      { table: "workouts", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    for (const { table, column } of cleanupTables) {
      const { error: deleteError } = await adminClient
        .from(table)
        .delete()
        .eq(column, user.id);

      if (deleteError) {
        console.error(`Failed to clear ${table}:`, deleteError);
      }
    }

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(
      user.id,
    );

    if (deleteUserError) {
      return new Response(JSON.stringify({ error: deleteUserError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("delete-account edge function failed:", error);
    return new Response(JSON.stringify({ error: "Failed to delete account" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
