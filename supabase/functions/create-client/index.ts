import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is a coach
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
    } = await supabase.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "coach") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      email,
      name,
      phone,
      age,
      startDate,
      startWeight,
      goalWeight,
      primaryGoal,
    } = body;

    // Generate a random password
    const password =
      crypto.randomUUID().slice(0, 12) +
      "A1!";

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role: "client" },
      });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Update profile with extra info
    await supabase
      .from("profiles")
      .update({ phone, age: parseInt(age) || null })
      .eq("id", userId);

    // Create client profile
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 182); // 26 weeks (6 months)

    const { data: clientProfile, error: cpError } = await supabase
      .from("client_profiles")
      .insert({
        user_id: userId,
        coach_id: caller.id,
        start_date: startDate,
        end_date: endDate.toISOString().split("T")[0],
        start_weight: parseFloat(startWeight) || null,
        goal_weight: parseFloat(goalWeight) || null,
        primary_goal: primaryGoal,
        current_phase: "foundation",
        current_week: 0,
        status: "active",
      })
      .select()
      .single();

    if (cpError) {
      return new Response(JSON.stringify({ error: cpError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = clientProfile.id;

    // Create 3 phases (26 weeks total)
    await supabase.from("phases").insert([
      {
        client_id: clientId,
        phase_number: 1,
        name: "Foundation",
        start_week: 1,
        end_week: 8,
        status: "active",
        focus_items: [
          "Lære at tracke korrekt",
          "Etablere træningsrutine",
          "Justere kosten til dit liv",
          "Skabe momentum",
        ],
        phase_goals: [
          "Tracke mad hver dag i 7 dage",
          "Gennemføre alle træninger",
          "Etablere søvnrutine",
        ],
      },
      {
        client_id: clientId,
        phase_number: 2,
        name: "Acceleration",
        start_week: 9,
        end_week: 17,
        status: "locked",
        focus_items: [
          "Progressive overload i træning",
          "Finpudse kostplan",
          "Tackle plateauer",
          "Bygge mental styrke",
        ],
        phase_goals: [],
      },
      {
        client_id: clientId,
        phase_number: 3,
        name: "Transformation",
        start_week: 18,
        end_week: 26,
        status: "locked",
        focus_items: [
          "Maksimal definition",
          "Vedligeholdelsesplan",
          "Livsstilsintegration",
          "Efter-program strategi",
        ],
        phase_goals: [],
      },
    ]);

    // Create 27 check-in slots (week 0-26)
    const checkins = Array.from({ length: 27 }, (_, i) => ({
      client_id: clientId,
      week_number: i,
      status: "pending" as const,
    }));
    await supabase.from("weekly_checkins").insert(checkins);

    // Create 5 coaching calls
    const sd = new Date(startDate);
    await supabase.from("coaching_calls").insert([
      {
        client_id: clientId,
        call_type: "opstart" as const,
        scheduled_at: sd.toISOString(),
        status: "scheduled" as const,
        duration_minutes: 30,
      },
      {
        client_id: clientId,
        call_type: "uge2_tjek" as const,
        scheduled_at: new Date(
          sd.getTime() + 14 * 86400000
        ).toISOString(),
        status: "scheduled" as const,
        duration_minutes: 30,
      },
      {
        client_id: clientId,
        call_type: "uge4_review" as const,
        scheduled_at: new Date(
          sd.getTime() + 28 * 86400000
        ).toISOString(),
        status: "scheduled" as const,
        duration_minutes: 30,
      },
      {
        client_id: clientId,
        call_type: "uge8_review" as const,
        scheduled_at: new Date(
          sd.getTime() + 56 * 86400000
        ).toISOString(),
        status: "scheduled" as const,
        duration_minutes: 30,
      },
      {
        client_id: clientId,
        call_type: "afslutning" as const,
        scheduled_at: new Date(
          sd.getTime() + 182 * 86400000
        ).toISOString(),
        status: "scheduled" as const,
        duration_minutes: 30,
      },
    ]);

    // Create 5 standard habits
    await supabase.from("daily_habits").insert([
      { client_id: clientId, habit_name: "Drak 3L vand", habit_order: 1 },
      { client_id: clientId, habit_name: "Fulgte kostplan", habit_order: 2 },
      { client_id: clientId, habit_name: "Trænede i dag", habit_order: 3 },
      { client_id: clientId, habit_name: "8 timers søvn", habit_order: 4 },
      {
        client_id: clientId,
        habit_name: "Supplement taget",
        habit_order: 5,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        clientId,
        password,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
