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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!ANTHROPIC_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("Missing API key configuration");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { textInput } = await req.json();

    if (!textInput || typeof textInput !== "string") {
      return new Response(JSON.stringify({ error: "Invalid text input" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `Du er en AI-assistent for en fitness platform (Coach Connect Hub).
Din opgave er at parse tekst fra en indsat kost- eller træningsplan og returnere dataen i et strengt JSON-format.

TEKST TIL PARSING:
${textInput}

INSTRUKTIONER:
Analysér teksten for enten måltider og makroer (Kostplan) ELLER træningsdage og øvelser (Træningsprogram). 
Returnér PRÆCIS dette JSON format (intet andet):
{
  "type": "nutrition" | "training" | "mixed",
  "nutrition": {
    "planName": "string",
    "caloriesTarget": number,
    "proteinG": number,
    "carbsG": number,
    "fatG": number,
    "meals": [
      {
        "mealName": "string",
        "description": "string",
        "calories": number,
        "proteinG": number,
        "carbsG": number,
        "fatG": number
      }
    ]
  },
  "training": {
    "programName": "string",
    "days": [
      {
        "dayName": "string",
        "exercises": [
          {
            "exerciseName": "string",
            "sets": number,
            "reps": "string f.eks. 8-12",
            "weight": "string f.eks. 40kg eller tom",
            "restSeconds": number,
            "notes": "string eller tom"
          }
        ]
      }
    ]
  }
}

Hvis teksten kun indeholder en kostplan, så lad 'training' være null. Hvis den kun indeholder et træningsprogram, lad 'nutrition' være null. Udled makroer pr. måltid og totalt hvis muligt, ellers returner 0. Vær så nøjagtig som muligt. Returnér KUN valid JSON uden markdown codeblocks.`;

    let response;
    
    // Brug Anthropic direkte hvis nøglen findes, ellers fald tilbage til Lovable Gateway
    if (ANTHROPIC_API_KEY) {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        }),
      });
    } else {
      // Fallback to Lovable Gateway with Claude model mapping
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-5-sonnet-20240620",
          messages: [
            { role: "system", content: "Returnér KUN valid JSON uden markdown codeblocks eller anden tekst." },
            { role: "user", content: prompt },
          ],
        }),
      });
    }

    if (!response.ok) {
      const errTxt = await response.text();
      console.error("AI API Error:", response.status, errTxt);
      return new Response(JSON.stringify({ error: "AI fejl" }), { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    let content = "";
    
    if (ANTHROPIC_API_KEY) {
      content = data.content?.[0]?.text ?? "";
    } else {
      content = data.choices?.[0]?.message?.content ?? "";
    }
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "AI returnerede ugyldigt format", raw: content }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (e: any) {
    console.error("ai-plan-parser error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
