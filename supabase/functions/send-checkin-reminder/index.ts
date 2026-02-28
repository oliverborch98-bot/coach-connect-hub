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

    // Get all active clients
    const { data: clients = [] } = await supabase
      .from("client_profiles")
      .select("id, user_id, profiles!client_profiles_user_id_fkey(full_name)")
      .eq("status", "active");

    const today = new Date().toISOString().split("T")[0];
    const reminders: string[] = [];

    for (const client of clients!) {
      // Check if there's a pending checkin this week
      const { data: pending } = await supabase
        .from("weekly_checkins")
        .select("id")
        .eq("client_id", client.id)
        .eq("status", "pending")
        .limit(1);

      if (pending && pending.length > 0) {
        // Get client email
        const { data: authUser } = await supabase.auth.admin.getUserById(client.user_id);
        if (authUser?.user?.email) {
          // Create notification
          await supabase.from("notifications").insert({
            user_id: client.user_id,
            title: "Check-in påmindelse",
            body: "Husk at udfylde din ugentlige check-in! Din coach venter på din opdatering.",
            type: "checkin_reminder",
          });

          // Log email
          await supabase.from("email_logs").insert({
            client_id: client.id,
            email_type: "checkin_reminder",
            recipient_email: authUser.user.email,
            subject: "Husk din ugentlige check-in",
            status: "sent",
          });

          reminders.push((client as any).profiles?.full_name ?? authUser.user.email);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: reminders.length, clients: reminders }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
