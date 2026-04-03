import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { guideName, content, chunks: providedChunks } = await req.json();

    let chunks: string[] = providedChunks || [];
    
    if (content && !providedChunks) {
      // Split content into chunks of ~500 words on paragraph breaks
      const paragraphs = content.split(/\n\s*\n/);
      let currentChunk = "";
      for (const p of paragraphs) {
        if ((currentChunk + p).split(/\s+/).length > 500 && currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? "\n\n" : "") + p;
        }
      }
      if (currentChunk) chunks.push(currentChunk.trim());
    }

    if (chunks.length === 0) {
      return new Response(JSON.stringify({ error: "No content or chunks provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing ${chunks.length} chunks for guide: ${guideName}`);
    let insertedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Embedding chunk ${i + 1}/${chunks.length}...`);
      
      let embedding: number[] | null = null;
      let retries = 0;
      const maxRetries = 3;

      while (!embedding && retries < maxRetries) {
        try {
          const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openAiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "text-embedding-3-small",
              input: chunk,
            }),
          });

          if (embedRes.status === 429) {
            console.warn(`Rate limit hit (429). Retrying in 2 seconds...`);
            await sleep(2000);
            retries++;
            continue;
          }

          if (!embedRes.ok) {
            const error = await embedRes.text();
            throw new Error(`OpenAI embedding failed: ${embedRes.statusText} - ${error}`);
          }

          const embedResult = await embedRes.json();
          embedding = embedResult.data[0].embedding;
          
          // Wait 500ms after each successful embedding call as requested
          await sleep(500);
        } catch (err: any) {
          retries++;
          if (retries === maxRetries) throw err;
          await sleep(2000);
        }
      }

      const { error: insertError } = await supabase
        .from("documents")
        .insert({
          content: chunk,
          embedding,
          metadata: { guide: guideName, chunk_index: i },
        });

      if (insertError) {
        console.error(`Database insertion error for chunk ${i}:`, insertError);
        throw insertError;
      }

      insertedCount++;
    }

    return new Response(JSON.stringify({ success: true, insertedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Critical error in seed-documents:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
