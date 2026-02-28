import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (profile?.role !== "coach") throw new Error("Not authorized");

    const { planId } = await req.json();
    if (!planId) throw new Error("Missing planId");

    const { data: plan, error: planErr } = await supabase
      .from("nutrition_plans")
      .select("*, client_profiles!nutrition_plans_client_id_fkey(id, user_id, profiles!client_profiles_user_id_fkey(full_name))")
      .eq("id", planId)
      .single();
    if (planErr || !plan) throw new Error("Plan not found");

    const clientUserId = plan.client_profiles?.user_id;
    if (!clientUserId) throw new Error("Client user not found");

    const { data: clientAuth } = await supabase.auth.admin.getUserById(clientUserId);
    const clientEmail = clientAuth?.user?.email;
    if (!clientEmail) throw new Error("Client email not found");

    const { data: meals = [] } = await supabase
      .from("meals")
      .select("*")
      .eq("plan_id", planId)
      .order("meal_order");

    const clientName = plan.client_profiles?.profiles?.full_name ?? "Klient";

    const mealsHtml = meals!.map((m: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;color:#e0e0e0;font-weight:600">${m.meal_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;text-align:center;color:#ccc">${m.calories ?? '–'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;text-align:center;color:#ccc">${m.protein_g ?? '–'}g</td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;text-align:center;color:#ccc">${m.carbs_g ?? '–'}g</td>
        <td style="padding:10px 12px;border-bottom:1px solid #2a2a4a;text-align:center;color:#ccc">${m.fat_g ?? '–'}g</td>
      </tr>
      ${m.description ? `<tr><td colspan="5" style="padding:4px 12px 12px;color:#888;font-size:13px">${m.description}</td></tr>` : ''}
    `).join('');

    const bodyHtml = `
      <h2 style="color:#D4A853;font-size:18px;margin-top:0">Din kostplan: ${plan.name}</h2>
      <p style="color:#ccc">Hej ${clientName}, her er din opdaterede kostplan.</p>
      
      <div style="background:#252545;border-radius:10px;padding:16px;margin:20px 0">
        <h3 style="font-size:14px;margin:0 0 10px;color:#D4A853">Daglige makromål</h3>
        <table style="width:100%;font-size:14px;color:#e0e0e0">
          <tr>
            <td><strong>${plan.calories_target ?? '–'}</strong> kcal</td>
            <td><strong>${plan.protein_g ?? '–'}g</strong> protein</td>
            <td><strong>${plan.carbs_g ?? '–'}g</strong> kulhydrat</td>
            <td><strong>${plan.fat_g ?? '–'}g</strong> fedt</td>
          </tr>
        </table>
      </div>

      ${plan.notes ? `<p style="color:#888;font-size:13px;margin-bottom:16px"><em>${plan.notes}</em></p>` : ''}

      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#252545">
            <th style="padding:10px 12px;text-align:left;color:#D4A853">Måltid</th>
            <th style="padding:10px 12px;text-align:center;color:#D4A853">Kcal</th>
            <th style="padding:10px 12px;text-align:center;color:#D4A853">Protein</th>
            <th style="padding:10px 12px;text-align:center;color:#D4A853">Kulhydrat</th>
            <th style="padding:10px 12px;text-align:center;color:#D4A853">Fedt</th>
          </tr>
        </thead>
        <tbody>${mealsHtml}</tbody>
      </table>`;

    // Wrap in email template
    const fullHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px">
    <div style="padding:24px 32px;border-bottom:2px solid #D4A853">
      <h1 style="margin:0;color:#D4A853;font-size:20px;font-weight:700;letter-spacing:1px">BUILT BY BORCH</h1>
    </div>
    <div style="padding:32px;color:#e0e0e0;font-size:14px;line-height:1.6">
      ${bodyHtml}
    </div>
    <div style="padding:20px 32px;border-top:1px solid #2a2a4a;text-align:center">
      <p style="margin:0;color:#666;font-size:11px">Oliver Borch · Built By Borch</p>
      <p style="margin:4px 0 0;color:#555;font-size:10px">The Build Method Platform</p>
    </div>
  </div>
</body>
</html>`;

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
          from: "Built By Borch <oliver@builtbyborch.dk>",
          to: [clientEmail],
          subject: `Din kostplan: ${plan.name}`,
          html: fullHtml,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Resend error:", errText);
        emailStatus = "failed";
      } else {
        emailStatus = "sent";
      }
    }

    // Update plan as email_sent
    await supabase
      .from("nutrition_plans")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", planId);

    // Log email
    await supabase.from("email_logs").insert({
      client_id: plan.client_id,
      email_type: "nutrition_plan",
      recipient_email: clientEmail,
      subject: `Din kostplan: ${plan.name}`,
      status: emailStatus,
    });

    return new Response(
      JSON.stringify({ success: true, message: `Email sendt til ${clientEmail}`, status: emailStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
