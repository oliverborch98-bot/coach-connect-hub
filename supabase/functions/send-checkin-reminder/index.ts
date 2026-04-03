import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildReminderHtml(clientName: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px">
    <div style="padding:24px 32px;border-bottom:2px solid #D4A853">
      <h1 style="margin:0;color:#D4A853;font-size:20px;font-weight:700;letter-spacing:1px">BUILT BY BORCH</h1>
    </div>
    <div style="padding:32px;color:#e0e0e0;font-size:14px;line-height:1.6">
      <h2 style="color:#D4A853;font-size:18px;margin-top:0">Husk din ugentlige check-in 💪</h2>
      <p>Hej ${clientName},</p>
      <p>Din ugentlige check-in mangler stadig at blive udfyldt. Det tager kun 2 minutter, og det hjælper mig med at tilpasse din plan optimalt.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/client/check-in" style="display:inline-block;padding:12px 32px;background:#D4A853;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Udfyld check-in nu</a>
      </div>
      <p style="color:#888;font-size:13px">Husk: Konsistens er nøglen til resultater. Hver check-in giver dig +10 points!</p>
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: clients = [] } = await supabase
      .from("client_profiles")
      .select("id, user_id, profiles!client_profiles_user_id_fkey(full_name)")
      .eq("status", "active");

    const reminders: string[] = [];

    for (const client of clients!) {
      const { data: pending } = await supabase
        .from("weekly_checkins")
        .select("id")
        .eq("client_id", client.id)
        .eq("status", "pending")
        .limit(1);

      if (pending && pending.length > 0) {
        const { data: authUser } = await supabase.auth.admin.getUserById(client.user_id);
        if (authUser?.user?.email) {
          const clientName = (client as any).profiles?.full_name ?? "Klient";

          // Send via Resend
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
                subject: "Husk din ugentlige check-in",
                html: buildReminderHtml(clientName),
              }),
            });

            emailStatus = res.ok ? "sent" : "failed";
            if (!res.ok) console.error("Resend error:", await res.text());
          }

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
            status: emailStatus,
          });

          reminders.push(clientName);
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
