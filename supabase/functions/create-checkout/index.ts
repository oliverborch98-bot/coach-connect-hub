import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICES: Record<string, string> = {
  the_system: "price_1T5kfz5LYWI6qfnW8zZkvbWw",
  build_method: "price_1T5kVF5LYWI6qfnWPsdY3vEl",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Verify caller is coach
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (callerProfile?.role !== "coach") throw new Error("Forbidden");

    const { clientProfileId, clientEmail, clientName, packageType } = await req.json();

    const priceId = PRICES[packageType];
    if (!priceId) throw new Error("Invalid package type");

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: clientEmail,
        name: clientName,
        metadata: { client_profile_id: clientProfileId },
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || "https://builtbyborch.dk";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/client?payment=success`,
      cancel_url: `${origin}/client?payment=cancelled`,
      metadata: {
        client_profile_id: clientProfileId,
        package_type: packageType,
      },
      subscription_data: {
        metadata: {
          client_profile_id: clientProfileId,
          package_type: packageType,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
