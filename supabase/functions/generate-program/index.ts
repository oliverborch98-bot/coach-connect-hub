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

    const { clientId, daysCount, phase, focus } = await req.json();

    // Fetch client + exercises
    const [clientRes, exercisesRes] = await Promise.all([
      supabase.from("client_profiles").select("*, profiles!client_profiles_user_id_fkey(full_name, age)").eq("id", clientId).single(),
      supabase.from("exercises").select("id, name, name_da, category, muscle_groups, equipment, difficulty").order("name"),
    ]);

    const client = clientRes.data;
    if (!client) return new Response(JSON.stringify({ error: "Klient ikke fundet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const clientName = (client as any).profiles?.full_name ?? "Klienten";
    const exercises = exercisesRes.data ?? [];

    // Build exercise catalog for AI
    const exerciseCatalog = exercises.map(e => 
      `${e.id}|${e.name_da || e.name}|${e.category}|${(e.muscle_groups ?? []).join(",")}|${e.difficulty}`
    ).join("\n");

    const prompt = `Generér et ${daysCount ?? 4}-dages træningsprogram for ${clientName}.

KLIENTDATA:
- Alder: ${(client as any).profiles?.age ?? 30}
- Vægt: ${client.start_weight ?? 80} kg
- Mål: ${client.primary_goal ?? focus ?? "generel fitness"}
- Fase: ${phase ?? client.current_phase ?? "foundation"}

TILGÆNGELIGE ØVELSER (id|navn|kategori|muskelgrupper|sværhedsgrad):
${exerciseCatalog}

INSTRUKTIONER:
1. Vælg KUN øvelser fra listen ovenfor (brug deres eksakte ID'er)
2. Opret ${daysCount ?? 4} træningsdage med passende navne (f.eks. "Overkrop Push", "Ben", "Pull")
3. 4-7 øvelser per dag
4. Passende sæt (3-4), reps (6-15), tempo og hvileperioder
5. Balancér muskelgrupper over ugen

Returnér PRÆCIS dette JSON format (intet andet):
{
  "programName": "string",
  "days": [
    {
      "dayName": "string",
      "exercises": [
        {
          "exerciseId": "uuid fra listen",
          "sets": number,
          "reps": "string f.eks. 8-12",
          "tempo": "string f.eks. 3010 eller tom",
          "restSeconds": number,
          "notes": "string eller tom"
        }
      ]
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
          { role: "system", content: "Du er en styrketræningsekspert. Returnér KUN valid JSON uden markdown codeblocks eller anden tekst." },
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
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const program = JSON.parse(content);
      return new Response(JSON.stringify(program), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returnerede ugyldigt format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e: any) {
    console.error("generate-program error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
