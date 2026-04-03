import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const today = new Date().toISOString().split("T")[0];
    const advanced: string[] = [];

    // Find phases that have ended and are still 'active'
    const { data: expiredPhases } = await supabase
      .from("phases")
      .select("id, client_id, phase_number")
      .eq("status", "active")
      .lte("end_date", today);

    for (const phase of expiredPhases ?? []) {
      // Mark current phase as completed
      await supabase
        .from("phases")
        .update({ status: "completed" })
        .eq("id", phase.id);

      // Find next phase for this client
      const { data: nextPhase } = await supabase
        .from("phases")
        .select("id, name, phase_number")
        .eq("client_id", phase.client_id)
        .eq("phase_number", (phase.phase_number ?? 0) + 1)
        .single();

      if (nextPhase) {
        // Activate next phase
        await supabase
          .from("phases")
          .update({ status: "active", start_date: today })
          .eq("id", nextPhase.id);

        // Update client_profiles current_phase
        const phaseName = nextPhase.name ?? `Fase ${nextPhase.phase_number}`;
        await supabase
          .from("client_profiles")
          .update({ current_phase: phaseName.toLowerCase() })
          .eq("id", phase.client_id);

        // Notify client
        const { data: cp } = await supabase
          .from("client_profiles")
          .select("user_id")
          .eq("id", phase.client_id)
          .single();

        if (cp) {
          await supabase.from("notifications").insert({
            user_id: cp.user_id,
            type: "phase",
            title: "Ny fase ulåst! 🚀",
            body: `Du er nu rykket til ${phaseName}. Tillykke med din fremgang!`,
          });
        }

        advanced.push(`${phase.client_id} → ${phaseName}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, advanced_count: advanced.length, details: advanced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Phase progression error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
