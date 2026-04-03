import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "coach") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { clientId, type, weeks, daysPerWeek, description } = await req.json();
    
    // Fetch available exercises to match UUIDs
    const { data: exercises } = await supabase.from("exercises").select("id, name, name_da, category").order("name");
    const exerciseCatalog = (exercises || []).map(e => `${e.id}|${e.name_da || e.name}|${e.category}`).join("\n");

    const systemPrompt = `Du er en professionel elite fitness coach. Din opgave er at generere strukturerede træningsprogrammer i JSON format.
Brug KUN de exerciseId'er der findes i det medsendte katalog.
Returnér KUN rå JSON. Ingen forklaringer, intet markdown (ingen \`\`\`json blokke).`;

    const prompt = `Generer et ${type} program for ${weeks} uger, ${daysPerWeek} dage om ugen.
Beskriv: ${description}. 

TILGÆNGELIGE ØVELSER (format: id|navn|kategori):
${exerciseCatalog}

SCHEMA:
{
  "programName": "string",
  "description": "string",
  "days": [
    {
      "dayName": "string",
      "exercises": [
        {
          "exerciseId": "uuid fra katalog",
          "name": "navn fra katalog",
          "sets": number,
          "reps": "f.eks. 10-12",
          "restSeconds": number,
          "notes": "string"
        }
      ]
    }
  ]
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }]
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Anthropic error:", err, response.status);
        return new Response(JSON.stringify({ error: `AI API fejl (${response.status})` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = data.content?.[0]?.text || "";
    
    // Clean up content (remove markdown blocks if AI ignored system prompt)
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    // Parse JSON
    let program;
    try {
      // Look for the first { and last } to be safe
      const start = content.indexOf('{');
      const end = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        content = content.substring(start, end + 1);
      }
      program = JSON.parse(content);
    } catch (e) {
      console.error("AI returnerede ugyldigt format:", content);
      return new Response(JSON.stringify({ 
        error: "AI returnerede ugyldigt format",
        debug: content.substring(0, 100) + "..." 
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, program }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-program-builder error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
