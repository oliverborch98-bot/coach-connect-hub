import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildReminderHtml(clientName: string, habitName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px">
    <div style="padding:24px 32px;border-bottom:2px solid #0066FF">
      <h1 style="margin:0;color:#0066FF;font-size:20px;font-weight:700;letter-spacing:1px">BUILT BY BORCH</h1>
    </div>
    <div style="padding:32px;color:#e0e0e0;font-size:14px;line-height:1.6">
      <h2 style="color:#0066FF;font-size:18px;margin-top:0">Husk din vane i dag! 🎯</h2>
      <p>Hej ${clientName},</p>
      <p>Du mangler stadig at logge "${habitName}" i dag. Konsistens er nøglen til succes!</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/client/habits" style="display:inline-block;padding:12px 32px;background:#0066FF;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Log vane nu</a>
      </div>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #2a2a4a;text-align:center">
      <p style="margin:0;color:#666;font-size:11px">Oliver Borch · Built By Borch</p>
      <p style="margin:4px 0 0;color:#555;font-size:10px">The Build Method Platform</p>
    </div>
  </div>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });

    const today = new Date().toISOString().split("T")[0];

    const { data: clientHabits, error: habitsError } = await supabase
      .from("client_habits")
      .select(`
        id, 
        push_notification_time,
        client_profiles!inner(user_id, profiles!client_profiles_user_id_fkey(full_name)),
        habits(name)
      `)
      .eq("is_active", true);

    if (habitsError) throw habitsError;

    const reminders: string[] = [];

    for (const ch of (clientHabits || [])) {
      // Check if logged today
      const { data: logs } = await supabase
        .from("habit_logs")
        .select("id, completed")
        .eq("client_habit_id", ch.id)
        .eq("date", today)
        .maybeSingle();

      if (!logs || !logs.completed) {
        // Safe access to nested relations
        const clientProfile = ch.client_profiles as any;
        const userId = clientProfile?.user_id;
        
        if (!userId) continue;

        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        
        if (authUser?.user?.email) {
          const clientName = clientProfile?.profiles?.full_name ?? "Klient";
          const habitName = (ch.habits as any)?.name ?? "din vane";
          
          let emailStatus = "logged";
          if (RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: Deno.env.get("FROM_EMAIL") || "Built By Borch <onboarding@resend.dev>",
                to: [authUser.user.email],
                subject: `Husk: ${habitName} 🎯`,
                html: buildReminderHtml(clientName, habitName),
              }),
            });
            emailStatus = res.ok ? "sent" : "failed";
          }

          // Create notification
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Husk din vane!",
            body: `Du mangler at logge "${habitName}" for i dag.`,
            type: "habit_reminder",
          });

          reminders.push(`${clientName} - ${habitName}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, reminders_sent: reminders.length, details: reminders }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
