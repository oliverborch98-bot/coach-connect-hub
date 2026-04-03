import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const openAiKey = Deno.env.get("OPENAI_API_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get the user's message
    const { messages } = await req.json();
    const lastUserMessage = messages.filter((m: any) => m.role === "user").pop()?.content || "";

    // 1. Create embedding for the user's query
    let contextFromGuides = "";
    if (lastUserMessage) {
      try {
        const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openAiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: lastUserMessage,
          }),
        });

        if (embedRes.ok) {
          const embedResult = await embedRes.json();
          const embedding = embedResult.data[0].embedding;

          // 2. Search for relevant guide chunks
          const { data: documents, error: matchError } = await supabase.rpc("match_documents", {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 3,
          });

          if (!matchError && documents) {
            contextFromGuides = documents
              .map((doc: any) => `[Fra guide: ${doc.metadata?.guide || "ukendt"}]\n${doc.content}`)
              .join("\n\n---\n\n");
          }
        }
      } catch (err) {
        console.error("Error fetching embeddings or matching documents:", err);
      }
    }

    // Get client profile with related data
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("*, profiles!client_profiles_user_id_fkey(full_name)")
      .eq("user_id", user.id)
      .single();

    if (!clientProfile) return new Response(JSON.stringify({ error: "No client profile" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Fetch context data
    const [goalsRes, habitsRes, planRes, programRes, phasesRes] = await Promise.all([
      supabase.from("goals").select("title, target_value, current_value, unit, status").eq("client_id", clientProfile.id),
      supabase.from("daily_habits").select("habit_name").eq("client_id", clientProfile.id).eq("active", true),
      supabase.from("nutrition_plans").select("name, calories_target, protein_g, carbs_g, fat_g, notes").eq("client_id", clientProfile.id).eq("status", "active").maybeSingle(),
      supabase.from("training_programs").select("name, phase").eq("client_id", clientProfile.id).eq("status", "active").maybeSingle(),
      supabase.from("phases").select("name, status, phase_number, focus_items, phase_goals").eq("client_id", clientProfile.id).order("phase_number"),
    ]);

    const clientName = (clientProfile as any).profiles?.full_name ?? "klienten";
    const contextParts: string[] = [];

    contextParts.push(`Klientens navn: ${clientName}`);
    contextParts.push(`Aktuel fase: ${clientProfile.current_phase ?? "ukendt"}, måned ${clientProfile.current_month ?? 1}/6`);
    contextParts.push(`Primært mål: ${clientProfile.primary_goal ?? "ikke angivet"}`);

    if (clientProfile.start_weight) contextParts.push(`Startvægt: ${clientProfile.start_weight} kg, målvægt: ${clientProfile.goal_weight ?? "?"} kg`);

    if (goalsRes.data?.length) {
      contextParts.push("Mål: " + goalsRes.data.map(g => `${g.title} (${g.current_value ?? 0}/${g.target_value} ${g.unit}, ${g.status})`).join("; "));
    }

    if (habitsRes.data?.length) {
      contextParts.push("Daglige habits: " + habitsRes.data.map(h => h.habit_name).join(", "));
    }

    if (planRes.data) {
      const p = planRes.data;
      contextParts.push(`Kostplan: ${p.name} — ${p.calories_target} kcal, ${p.protein_g}g protein, ${p.carbs_g}g kulhydrat, ${p.fat_g}g fedt. ${p.notes ?? ""}`);
    }

    if (programRes.data) {
      contextParts.push(`Træningsprogram: ${programRes.data.name} (fase: ${programRes.data.phase})`);
    }

    if (phasesRes.data?.length) {
      const activePhase = phasesRes.data.find(p => p.status === "active");
      if (activePhase) {
        contextParts.push(`Aktiv fase: ${activePhase.name} — Fokus: ${(activePhase.focus_items ?? []).join(", ")}. Mål: ${(activePhase.phase_goals ?? []).join(", ")}`);
      }
    }

    const systemPrompt = `Du er en venlig og motiverende AI-fitnessassistent for The Build Method coaching-platformen. Du hjælper klienten med spørgsmål om deres træning, kost, habits og generel fitness.

REGLER:
- Svar ALTID på dansk
- Brug klientens data til at give personlige svar
- Vær motiverende men ærlig
- Hvis klienten spørger om noget der kræver coachens godkendelse (ændring af plan, ny kostplan osv.), henvis dem til at kontakte coachen via beskeder
- Hold svar korte og præcise (max 200 ord)
- Du må IKKE ændre klientens planer — kun rådgive
- Brug markdown til formatering

KLIENTDATA:
${contextParts.join("\n")}

COACHING VIDEN (Prioritér denne viden hvis relevant):
${contextFromGuides || "Ingen specifikke guides fundet for dette spørgsmål. Svar ud fra din generelle viden som The Build Method assistent."}

Tone: Direkte, ingen fyldord, baseret på disciplin og handling.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI er midlertidigt overbelastet. Prøv igen om lidt." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-kredit opbrugt." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e: any) {
    console.error("client-chat error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
