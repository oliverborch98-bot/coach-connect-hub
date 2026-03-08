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

    const { clientId, pastedProgram, coachPrompt } = await req.json();

    if (!clientId || !pastedProgram) {
      return new Response(JSON.stringify({ error: "Mangler klient eller program-tekst" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch client + exercises
    const [clientRes, exercisesRes] = await Promise.all([
      supabase.from("client_profiles").select("*, profiles!client_profiles_user_id_fkey(full_name, age)").eq("id", clientId).single(),
      supabase.from("exercises").select("id, name, name_da, category, muscle_groups, equipment, difficulty").order("name"),
    ]);

    const client = clientRes.data;
    if (!client) return new Response(JSON.stringify({ error: "Klient ikke fundet" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const clientName = (client as any).profiles?.full_name ?? "Klienten";
    const exercises = exercisesRes.data ?? [];

    const exerciseCatalog = exercises.map(e =>
      `${e.id}|${e.name_da || e.name}|${e.category}|${(e.muscle_groups ?? []).join(",")}|${e.difficulty}`
    ).join("\n");

    const prompt = `Du er en styrketræningsekspert. En coach har indsat følgende program for klienten ${clientName}:

--- COACH'S PROGRAM ---
${pastedProgram}
--- SLUT ---

${coachPrompt ? `COACH'S INSTRUKTIONER: ${coachPrompt}` : ""}

KLIENTDATA:
- Alder: ${(client as any).profiles?.age ?? 30}
- Vægt: ${client.start_weight ?? 80} kg
- Mål: ${client.primary_goal ?? "generel fitness"}
- Fase: ${client.current_phase ?? "foundation"}

TILGÆNGELIGE ØVELSER (id|navn|kategori|muskelgrupper|sværhedsgrad):
${exerciseCatalog}

INSTRUKTIONER:
1. Analysér programmet og match øvelserne med øvelser fra listen ovenfor (brug deres eksakte UUID'er)
2. Hvis en øvelse fra programmet ikke matcher nogen øvelse i listen, vælg den nærmeste matchende øvelse
3. Bevar programmets struktur (dage, sæt, reps, tempo, hvile)
4. Opret et programnavn baseret på indholdet

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
      if (response.status === 429) return new Response(JSON.stringify({ error: "AI overbelastet. Prøv igen om lidt." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI-kredit opbrugt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let program;
    try {
      program = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returnerede ugyldigt format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Auto-insert into database
    const { data: dbProgram, error: pErr } = await supabase
      .from("training_programs")
      .insert({ client_id: clientId, name: program.programName, phase: client.current_phase, status: "active" })
      .select("id")
      .single();
    if (pErr) throw pErr;

    for (let di = 0; di < (program.days ?? []).length; di++) {
      const day = program.days[di];
      const { data: dbDay, error: dErr } = await supabase
        .from("training_days")
        .insert({ program_id: dbProgram.id, day_name: day.dayName, day_order: di })
        .select("id")
        .single();
      if (dErr) throw dErr;

      const exInserts = (day.exercises ?? [])
        .filter((ex: any) => ex.exerciseId)
        .map((ex: any, ei: number) => ({
          training_day_id: dbDay.id,
          exercise_id: ex.exerciseId,
          exercise_order: ei,
          sets: ex.sets ?? 3,
          reps: ex.reps ?? "8-12",
          tempo: ex.tempo || null,
          rest_seconds: ex.restSeconds ?? 90,
          notes: ex.notes || null,
        }));

      if (exInserts.length > 0) {
        const { error: eErr } = await supabase.from("training_exercises").insert(exInserts);
        if (eErr) throw eErr;
      }
    }

    return new Response(JSON.stringify({ success: true, programId: dbProgram.id, programName: program.programName }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-build-program error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
