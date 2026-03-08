import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify coach
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "coach") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { clientId, pastedPlan, coachPrompt } = await req.json();

    if (!clientId || !pastedPlan) {
      return new Response(JSON.stringify({ error: "Mangler klient eller kostplan-tekst" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: client } = await supabase
      .from("client_profiles")
      .select("*, profiles!client_profiles_user_id_fkey(full_name, age)")
      .eq("id", clientId)
      .single();

    if (!client) return new Response(JSON.stringify({ error: "Klient ikke fundet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const clientName = (client as any).profiles?.full_name ?? "Klienten";

    const prompt = `Du er en ernæringsekspert. En coach har indsat følgende kostplan for klienten ${clientName}:

--- COACH'S KOSTPLAN ---
${pastedPlan}
--- SLUT ---

${coachPrompt ? `COACH'S INSTRUKTIONER: ${coachPrompt}` : ""}

KLIENTDATA:
- Alder: ${(client as any).profiles?.age ?? 30} år
- Nuværende vægt: ${client.start_weight ?? 80} kg
- Målvægt: ${client.goal_weight ?? client.start_weight ?? 80} kg
- Mål: ${client.primary_goal ?? "generel sundhed"}
- Fase: ${client.current_phase ?? "foundation"}

INSTRUKTIONER:
1. Analysér kostplanen og strukturér den korrekt
2. Beregn makroer og kalorier for hvert måltid hvis de ikke er angivet
3. Bevar coach'ens intentioner og måltidsstruktur
4. Opret et plannavn baseret på indholdet

Returnér PRÆCIS dette JSON format (intet andet):
{
  "planName": "string",
  "caloriesTarget": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "notes": "string med kort forklaring",
  "meals": [
    {
      "mealName": "string",
      "description": "string med ingredienser og mængder",
      "calories": number,
      "proteinG": number,
      "carbsG": number,
      "fatG": number
    }
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du er en ernæringsekspert. Returnér KUN valid JSON uden markdown codeblocks eller anden tekst." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "AI overbelastet. Prøv igen om lidt." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI-kredit opbrugt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returnerede ugyldigt format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-insert into database
    const { data: dbPlan, error: pErr } = await supabase
      .from("nutrition_plans")
      .insert({
        client_id: clientId,
        name: plan.planName,
        phase: client.current_phase,
        calories_target: plan.caloriesTarget || null,
        protein_g: plan.proteinG || null,
        carbs_g: plan.carbsG || null,
        fat_g: plan.fatG || null,
        notes: plan.notes || null,
        meals_per_day: (plan.meals ?? []).length,
        status: "active",
      })
      .select("id")
      .single();
    if (pErr) throw pErr;

    const mealInserts = (plan.meals ?? []).map((m: any, i: number) => ({
      plan_id: dbPlan.id,
      meal_name: m.mealName,
      meal_order: i,
      description: m.description || null,
      calories: m.calories || null,
      protein_g: m.proteinG || null,
      carbs_g: m.carbsG || null,
      fat_g: m.fatG || null,
    }));

    if (mealInserts.length > 0) {
      const { error: mErr } = await supabase.from("meals").insert(mealInserts);
      if (mErr) throw mErr;
    }

    return new Response(JSON.stringify({ success: true, planId: dbPlan.id, planName: plan.planName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-build-nutrition error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
