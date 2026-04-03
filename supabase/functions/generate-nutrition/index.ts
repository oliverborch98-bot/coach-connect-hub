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

    const { clientId, mealsCount, goal } = await req.json();

    // Fetch client data
    const { data: client } = await supabase
      .from("client_profiles")
      .select("*, profiles!client_profiles_user_id_fkey(full_name, age)")
      .eq("id", clientId)
      .single();

    if (!client) return new Response(JSON.stringify({ error: "Klient ikke fundet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const clientName = (client as any).profiles?.full_name ?? "Klienten";
    const age = (client as any).profiles?.age ?? 30;
    const weight = client.start_weight ?? 80;
    const goalWeight = client.goal_weight ?? weight;

    const prompt = `Generér en komplet kostplan for ${clientName}.

KLIENTDATA:
- Alder: ${age} år
- Nuværende vægt: ${weight} kg
- Målvægt: ${goalWeight} kg
- Primært mål: ${client.primary_goal ?? goal ?? "generel sundhed"}
- Fase: ${client.current_phase ?? "foundation"}
- Antal måltider: ${mealsCount ?? 4}

INSTRUKTIONER:
1. Beregn TDEE baseret på alder, vægt og mål
2. Justér kalorier baseret på mål (deficit for vægttab, surplus for muskelopbygning)
3. Fordel makroer: protein ~2g/kg, fedt ~0.8-1g/kg, resten kulhydrater
4. Opret ${mealsCount ?? 4} måltider der passer til danske madvaner
5. Giv beskrivende beskrivelser af hvert måltid med gramvægte

Returnér PRÆCIS dette JSON format (intet andet):
{
  "planName": "string",
  "caloriesTarget": number,
  "proteinG": number,
  "carbsG": number,
  "fatG": number,
  "notes": "string med kort forklaring af planen",
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
      if (response.status === 429) return new Response(JSON.stringify({ error: "AI overbelastet." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI-kredit opbrugt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const plan = JSON.parse(content);
      return new Response(JSON.stringify(plan), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returnerede ugyldigt format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e: any) {
    console.error("generate-nutrition error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
