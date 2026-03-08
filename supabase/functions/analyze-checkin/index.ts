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
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "coach") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { clientId, checkinId } = await req.json();

    // Fetch check-in data and history
    const [checkinRes, historyRes, clientRes, goalsRes, planRes] = await Promise.all([
      supabase.from("weekly_checkins").select("*").eq("id", checkinId).single(),
      supabase.from("weekly_checkins").select("*").eq("client_id", clientId).in("status", ["submitted", "reviewed"]).order("checkin_number", { ascending: true }),
      supabase.from("client_profiles").select("*, profiles!client_profiles_user_id_fkey(full_name)").eq("id", clientId).single(),
      supabase.from("goals").select("title, target_value, current_value, unit").eq("client_id", clientId).eq("status", "active"),
      supabase.from("nutrition_plans").select("calories_target, protein_g").eq("client_id", clientId).eq("status", "active").maybeSingle(),
    ]);

    const ci = checkinRes.data;
    const history = historyRes.data ?? [];
    const client = clientRes.data;
    const clientName = (client as any)?.profiles?.full_name ?? "Klienten";

    const historyStr = history.map(h =>
      `#${h.checkin_number}: vægt=${h.weight ?? "?"}kg, kcal=${h.avg_calories ?? "?"}, træning=${h.workouts_completed ?? 0}/${h.workouts_target ?? 4}, energi=${h.energy_level ?? "?"}/10, søvn=${h.sleep_quality ?? "?"}/10`
    ).join("\n");

    const prompt = `Analysér denne ugentlige check-in for ${clientName} og giv coachen et kort, handlingsorienteret resumé.

AKTUEL CHECK-IN (#${ci.checkin_number}):
- Vægt: ${ci.weight ?? "ikke angivet"} kg
- Fedt%: ${ci.body_fat_pct ?? "ikke angivet"}
- Gns. kalorier: ${ci.avg_calories ?? "ikke angivet"}
- Træninger: ${ci.workouts_completed ?? 0}/${ci.workouts_target ?? 4}
- Energi: ${ci.energy_level ?? "?"}/10
- Søvn: ${ci.sleep_quality ?? "?"}/10
- Klientens noter: ${ci.client_notes ?? "ingen"}

HISTORIK:
${historyStr || "Ingen tidligere check-ins"}

KLIENTDATA:
- Startvægt: ${client?.start_weight ?? "?"} kg, målvægt: ${client?.goal_weight ?? "?"} kg
- Fase: ${client?.current_phase}, måned ${client?.current_month}/6
- Mål: ${(goalsRes.data ?? []).map(g => `${g.title}: ${g.current_value}/${g.target_value} ${g.unit}`).join(", ") || "ingen"}
- Kalorietarget: ${planRes.data?.calories_target ?? "ikke sat"} kcal

Giv output i denne struktur (brug markdown):
1. **Opsummering** (2-3 sætninger om ugens præstation)
2. **Tendenser** (hvad bevæger sig i den rigtige/forkerte retning)
3. **Handlingsforslag** (2-3 konkrete ting coachen kan foreslå)
4. **Feedback-forslag** (en kort, motiverende besked coachen kan sende til klienten)

Svar på dansk. Vær præcis og datadrevet.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du er en AI-assistent for en fitness-coach. Analysér check-in data og giv actionable insights på dansk." },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "AI overbelastet, prøv igen." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI-kredit opbrugt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e: any) {
    console.error("analyze-checkin error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
