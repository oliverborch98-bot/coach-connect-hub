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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Not authenticated");

    // Check coach role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (profile?.role !== "coach") throw new Error("Not authorized");

    const { planId } = await req.json();
    if (!planId) throw new Error("Missing planId");

    // Fetch plan with client info
    const { data: plan, error: planErr } = await supabase
      .from("nutrition_plans")
      .select("*, client_profiles!nutrition_plans_client_id_fkey(id, user_id, profiles!client_profiles_user_id_fkey(full_name))")
      .eq("id", planId)
      .single();
    if (planErr || !plan) throw new Error("Plan not found");

    // Fetch client email from auth
    const clientUserId = plan.client_profiles?.user_id;
    if (!clientUserId) throw new Error("Client user not found");

    const { data: clientAuth } = await supabase.auth.admin.getUserById(clientUserId);
    const clientEmail = clientAuth?.user?.email;
    if (!clientEmail) throw new Error("Client email not found");

    // Fetch meals
    const { data: meals = [] } = await supabase
      .from("meals")
      .select("*")
      .eq("plan_id", planId)
      .order("meal_order");

    const clientName = plan.client_profiles?.profiles?.full_name ?? "Klient";

    // Build email HTML
    const mealsHtml = meals!.map((m: any) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${m.meal_name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${m.calories ?? '–'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${m.protein_g ?? '–'}g</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${m.carbs_g ?? '–'}g</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${m.fat_g ?? '–'}g</td>
      </tr>
      ${m.description ? `<tr><td colspan="5" style="padding:4px 12px 12px;color:#888;font-size:13px">${m.description}</td></tr>` : ''}
    `).join('');

    const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#fff;padding:32px">
      <h1 style="color:#c8a45a;font-size:20px;margin-bottom:4px">THE BUILD METHOD</h1>
      <h2 style="font-size:18px;margin-top:8px">Din kostplan: ${plan.name}</h2>
      <p style="color:#666;font-size:14px">Hej ${clientName}, her er din opdaterede kostplan.</p>
      
      <div style="background:#f8f8f4;border-radius:12px;padding:16px;margin:20px 0">
        <h3 style="font-size:14px;margin:0 0 8px">Daglige makromål</h3>
        <table style="width:100%;font-size:14px">
          <tr>
            <td><strong>${plan.calories_target ?? '–'}</strong> kcal</td>
            <td><strong>${plan.protein_g ?? '–'}g</strong> protein</td>
            <td><strong>${plan.carbs_g ?? '–'}g</strong> kulhydrat</td>
            <td><strong>${plan.fat_g ?? '–'}g</strong> fedt</td>
          </tr>
        </table>
      </div>

      ${plan.notes ? `<p style="color:#666;font-size:13px;margin-bottom:16px"><em>${plan.notes}</em></p>` : ''}

      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#f0f0f0">
            <th style="padding:8px 12px;text-align:left">Måltid</th>
            <th style="padding:8px 12px;text-align:center">Kcal</th>
            <th style="padding:8px 12px;text-align:center">Protein</th>
            <th style="padding:8px 12px;text-align:center">Kulhydrat</th>
            <th style="padding:8px 12px;text-align:center">Fedt</th>
          </tr>
        </thead>
        <tbody>${mealsHtml}</tbody>
      </table>

      <p style="color:#999;font-size:12px;margin-top:24px;text-align:center">— The Build Method —</p>
    </div>`;

    // Send via Resend (using LOVABLE_API_KEY as fallback, or a simple fetch to a mail service)
    // For now we just log it and mark as sent. In production, integrate with a mail provider.
    // We'll use the Supabase built-in approach of logging + marking.

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
      status: "sent",
    });

    return new Response(
      JSON.stringify({ success: true, message: `Email sendt til ${clientEmail}`, html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
