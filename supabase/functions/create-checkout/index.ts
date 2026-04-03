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

    // Verify JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { package: packageType, userId } = await req.json();

    if (!packageType || !userId) {
      throw new Error("Missing package or userId in request body");
    }

    const priceId = PRICES[packageType];
    if (!priceId) throw new Error("Invalid package type");

    // Get user email
    const { data: authUser, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    if (getUserError || !authUser.user) throw new Error("Target user not found");
    const email = authUser.user.email;

    // Get client profile ID
    const { data: clientProfile, error: profileError } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (profileError || !clientProfile) throw new Error("Client profile not found");
    const clientProfileId = clientProfile.id;

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { 
          user_id: userId,
          client_profile_id: clientProfileId 
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      currency: "dkk",
      success_url: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/client/dashboard?payment=success`,
      cancel_url: `${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/client/dashboard?payment=cancelled`,
      client_reference_id: userId,
      subscription_data: {
        metadata: {
          package: packageType,
          user_id: userId,
          client_profile_id: clientProfileId,
        },
      },
      metadata: {
        package: packageType,
        user_id: userId,
        client_profile_id: clientProfileId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
