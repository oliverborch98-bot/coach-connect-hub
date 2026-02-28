import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICES: Record<string, string> = {
  the_system: "price_1T5kfz5LYWI6qfnW8zZkvbWw",
  build_method: "price_1T5kVF5LYWI6qfnWPsdY3vEl",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is a coach
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user: caller },
    } = await supabase.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "coach") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      email,
      name,
      phone,
      age,
      startDate,
      startWeight,
      goalWeight,
      primaryGoal,
      packageType,
    } = body;

    const monthlyPrice = packageType === "build_method" ? 1500 : 1000;

    // Generate a random password
    const password = crypto.randomUUID().slice(0, 12) + "A1!";

    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role: "client" },
      });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Update profile with extra info
    await supabase
      .from("profiles")
      .update({ phone, age: parseInt(age) || null })
      .eq("id", userId);

    // Calculate binding end (6 months)
    const subscriptionStart = new Date(startDate);
    const bindingEnd = new Date(subscriptionStart);
    bindingEnd.setMonth(bindingEnd.getMonth() + 6);

    // Create client profile
    const { data: clientProfile, error: cpError } = await supabase
      .from("client_profiles")
      .insert({
        user_id: userId,
        coach_id: caller.id,
        package_type: packageType,
        subscription_start: startDate,
        binding_end: bindingEnd.toISOString().split("T")[0],
        monthly_price: monthlyPrice,
        current_month: 1,
        current_phase: "foundation",
        start_weight: parseFloat(startWeight) || null,
        goal_weight: parseFloat(goalWeight) || null,
        primary_goal: primaryGoal,
        status: "active",
      })
      .select()
      .single();

    if (cpError) {
      return new Response(JSON.stringify({ error: cpError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = clientProfile.id;

    // Create 3 phases
    const phase2Start = new Date(subscriptionStart);
    phase2Start.setMonth(phase2Start.getMonth() + 2);
    const phase3Start = new Date(subscriptionStart);
    phase3Start.setMonth(phase3Start.getMonth() + 4);

    await supabase.from("phases").insert([
      {
        client_id: clientId,
        phase_number: 1,
        name: "Foundation",
        start_date: startDate,
        end_date: phase2Start.toISOString().split("T")[0],
        status: packageType === "build_method" ? "active" : "locked",
        focus_items: [
          "Lære at tracke korrekt",
          "Etablere træningsrutine",
          "Justere kosten til dit liv",
          "Skabe momentum",
        ],
        phase_goals: [
          "Tracke mad hver dag i 7 dage",
          "Gennemføre alle træninger",
          "Etablere søvnrutine",
        ],
      },
      {
        client_id: clientId,
        phase_number: 2,
        name: "Acceleration",
        start_date: phase2Start.toISOString().split("T")[0],
        end_date: phase3Start.toISOString().split("T")[0],
        status: "locked",
        focus_items: [
          "Progressive overload i træning",
          "Finpudse kostplan",
          "Tackle plateauer",
          "Bygge mental styrke",
        ],
        phase_goals: [],
      },
      {
        client_id: clientId,
        phase_number: 3,
        name: "Transformation",
        start_date: phase3Start.toISOString().split("T")[0],
        end_date: bindingEnd.toISOString().split("T")[0],
        status: "locked",
        focus_items: [
          "Maksimal definition",
          "Vedligeholdelsesplan",
          "Livsstilsintegration",
          "Efter-program strategi",
        ],
        phase_goals: [],
      },
    ]);

    // Create 5 standard habits
    await supabase.from("daily_habits").insert([
      { client_id: clientId, habit_name: "Drak 3L vand", habit_order: 1 },
      { client_id: clientId, habit_name: "Fulgte kostplan", habit_order: 2 },
      { client_id: clientId, habit_name: "Trænede i dag", habit_order: 3 },
      { client_id: clientId, habit_name: "8 timers søvn", habit_order: 4 },
      { client_id: clientId, habit_name: "Supplement taget", habit_order: 5 },
    ]);

    // Create kickoff call
    await supabase.from("coaching_calls").insert({
      client_id: clientId,
      call_type: "kickoff",
      scheduled_at: subscriptionStart.toISOString(),
      status: "scheduled",
      duration_minutes: 30,
    });

    // Create first pending check-in
    await supabase.from("weekly_checkins").insert({
      client_id: clientId,
      checkin_number: 1,
      status: "pending",
    });

    // Create accountability score
    await supabase.from("accountability_scores").insert({
      client_id: clientId,
    });

    // Create Stripe checkout session
    let checkoutUrl = null;
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const priceId = PRICES[packageType];

        // Create or find Stripe customer
        const customers = await stripe.customers.list({ email, limit: 1 });
        let customerId: string;
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email,
            name,
            metadata: { client_profile_id: clientId },
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
            client_profile_id: clientId,
            package_type: packageType,
          },
          subscription_data: {
            metadata: {
              client_profile_id: clientId,
              package_type: packageType,
            },
          },
        });

        checkoutUrl = session.url;
      }
    } catch (stripeErr: any) {
      console.error("Stripe checkout creation failed:", stripeErr.message);
      // Don't fail the entire request if Stripe fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        clientId,
        password,
        checkoutUrl,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
