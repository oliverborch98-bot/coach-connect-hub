import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const email = "testklient@buildmethod.dk";
    const password = "TestKlient2024!";
    const name = "Test Kansen";

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
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

    // Find coach
    const { data: coach } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "coach")
      .limit(1)
      .single();

    if (!coach) {
      return new Response(JSON.stringify({ error: "No coach found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({ phone: "+45 12 34 56 78", age: 28 })
      .eq("id", userId);

    // Create client profile
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 84 * 86400000);

    const { data: clientProfile, error: cpError } = await supabase
      .from("client_profiles")
      .insert({
        user_id: userId,
        coach_id: coach.id,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        start_weight: 85,
        goal_weight: 78,
        primary_goal: "Vægttab og muskelopbygning",
        current_phase: "foundation",
        current_week: 3,
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

    // Create phases
    await supabase.from("phases").insert([
      { client_id: clientId, phase_number: 1, name: "Foundation", start_week: 1, end_week: 4, status: "active", focus_items: ["Lære at tracke korrekt", "Etablere træningsrutine"], phase_goals: ["Tracke mad hver dag", "Gennemføre alle træninger"] },
      { client_id: clientId, phase_number: 2, name: "Acceleration", start_week: 5, end_week: 8, status: "locked" },
      { client_id: clientId, phase_number: 3, name: "Transformation", start_week: 9, end_week: 12, status: "locked" },
    ]);

    // Create check-in slots
    const checkins = Array.from({ length: 13 }, (_, i) => ({
      client_id: clientId,
      week_number: i,
      status: i < 3 ? "submitted" as const : "pending" as const,
      weight: i < 3 ? 85 - i * 0.5 : null,
      submitted_at: i < 3 ? new Date(startDate.getTime() - (3 - i) * 7 * 86400000).toISOString() : null,
    }));
    await supabase.from("weekly_checkins").insert(checkins);

    // Create habits
    await supabase.from("daily_habits").insert([
      { client_id: clientId, habit_name: "Drak 3L vand", habit_order: 1 },
      { client_id: clientId, habit_name: "Fulgte kostplan", habit_order: 2 },
      { client_id: clientId, habit_name: "Trænede i dag", habit_order: 3 },
      { client_id: clientId, habit_name: "8 timers søvn", habit_order: 4 },
      { client_id: clientId, habit_name: "Supplement taget", habit_order: 5 },
    ]);

    return new Response(JSON.stringify({ success: true, clientId, email, password }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
