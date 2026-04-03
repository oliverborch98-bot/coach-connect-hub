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

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { exerciseName, videoUrl, frameData } = await req.json();

    const prompt = `Du er en ekspert fitness coach og biomekanik-specialist. 
Analysér denne video/billede af en klient, der udfører øvelsen: "${exerciseName}".

Giv handlingsorienteret feedback på dansk:
1. **Teknik Audit**: Hvad gør de godt, og hvad skal rettes? (f.eks. bar path, depth, rygposition).
2. **Tempo & Kontrol**: Er bevægelsen kontrolleret?
3. **Risiko**: Er der øget risiko for skader baseret på formen?
4. **Korrektion**: Én specifik 'cue' de skal tænke på næste gang.

Svar i et venligt, professionelt og motiverende sprog. Brug markdown.`;

    // Construct request to Lovable Gateway (Gemini 2.0 Flash)
    // Note: If using direct frameData (base64), we include it in the message content
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          frameData ? { type: "image_url", image_url: { url: frameData } } : { type: "text", text: `Video URL: ${videoUrl}` }
        ]
      }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify(result.choices[0].message.content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("analyze-form error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
