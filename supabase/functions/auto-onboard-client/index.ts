import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://coach-connect-hub.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload = await req.json();
    console.log("Onboarding triggered for payload:", payload);
    
    // Support both direct calls and DB webhook triggers
    const record = payload.record || payload; 
    
    if (!record || !record.id) {
      throw new Error("No record/id provided in payload");
    }

    const clientId = record.id;
    const userId = record.user_id;

    // 1. Fetch client and coach details
    const { data: client, error: clientErr } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (clientErr) throw clientErr;

    const { data: coach, error: coachErr } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", record.coach_id)
      .single();

    if (coachErr) throw coachErr;

    // 2. Send Welcome Email to Client
    if (RESEND_API_KEY) {
      const welcomeHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #000; color: #fff; border-radius: 12px; border: 1px solid #1a1a1a;">
          <h1 style="color: #0066FF; font-size: 24px;">Velkommen til Built By Borch, ${client.full_name}!</h1>
          <p style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">Vi glæder os til at komme i gang med din rejse mod bedre resultater.</p>
          <div style="background: #0a0a0a; padding: 20px; border-radius: 8px; border: 1px solid #222; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Login instrukser:</p>
            <p style="margin: 10px 0 0 0;"><a href="${SITE_URL}/login" style="color: #0066FF; text-decoration: none;">Klik her for at logge ind på platformen</a></p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #71717a;">Brug din email: ${client.email}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.5; color: #a1a1aa;">Hvad du kan forvente:</p>
          <ul style="color: #a1a1aa; padding-left: 20px;">
            <li>Ugentlige check-ins (din første er klar om 7 dage)</li>
            <li>Skræddersyet træningsprogram</li>
            <li>Kostvejledning og habit tracking</li>
          </ul>
          <p style="margin-top: 30px; border-top: 1px solid #1a1a1a; padding-top: 20px; font-size: 14px; color: #52525b;">
            Built By Borch &copy; ${new Date().getFullYear()}
          </p>
        </div>
      `;

      const welcomeRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL") || "Built By Borch <onboarding@resend.dev>",
          to: [client.email],
          subject: `Velkommen til Built By Borch, ${client.full_name}!`,
          html: welcomeHtml,
        }),
      });

      console.log("Welcome email sent status:", welcomeRes.status);

      // Log email
      await supabase.from("email_logs").insert({
        client_id: clientId,
        email_type: "welcome_auto",
        recipient_email: client.email,
        subject: `Velkommen til Built By Borch, ${client.full_name}!`,
        status: welcomeRes.ok ? "sent" : "failed"
      });

      // 3. Notify Coach
      const coachHtml = `
        <div style="font-family: sans-serif;">
          <h2 style="color: #0066FF;">Ny klient tilmeldt: ${client.full_name}</h2>
          <p>En ny klient er blevet oprettet og onboardet automatisk.</p>
          <p><a href="${SITE_URL}/coach/clients/${clientId}" style="color: #0066FF;">Se klientens profil her</a></p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Built By Borch <system@resend.dev>",
          to: [coach.email],
          subject: `Ny klient tilmeldt: ${client.full_name}`,
          html: coachHtml,
        }),
      });
    }

    // 4. Create first check-in task (due in 7 days)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Check if a check-in already exists
    const { data: existingCheckin } = await supabase
      .from("weekly_checkins")
      .select("id")
      .eq("client_id", clientId)
      .eq("checkin_number", 1)
      .maybeSingle();

    if (!existingCheckin) {
      await supabase.from("weekly_checkins").insert({
        client_id: clientId,
        checkin_number: 1,
        status: "pending",
        date: dueDateStr
      });
    } else {
      // Update existing check-in date
      await supabase
        .from("weekly_checkins")
        .update({ date: dueDateStr })
        .eq("id", existingCheckin.id);
    }

    // 5. Update onboarding state and timestamp
    const { error: updateErr } = await supabase
      .from("client_profiles")
      .update({
        onboarding_completed: false, // Ensure it's false to trigger wizard
        auto_onboarded_at: new Date().toISOString()
      })
      .eq("id", clientId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ success: true, clientId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("Onboarding error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
