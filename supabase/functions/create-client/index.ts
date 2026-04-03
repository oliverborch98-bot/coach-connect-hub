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

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const buildWelcomeHtml = (name: string, email: string, password: string, coachName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #000000; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; padding: 40px; background-color: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 24px; }
    .logo { color: #2563eb; font-size: 24px; font-weight: 900; letter-spacing: -1px; margin-bottom: 30px; text-align: center; }
    .greeting { font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #ffffff; }
    .content { font-size: 16px; margin-bottom: 30px; color: #a1a1aa; }
    .credentials { background-color: #111111; padding: 25px; border-radius: 16px; border: 1px solid #222222; margin-bottom: 30px; }
    .credential-label { font-size: 12px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    .credential-value { font-size: 16px; color: #ffffff; font-family: monospace; }
    .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-align: center; width: 100%; box-sizing: border-box; }
    .footer { font-size: 12px; color: #52525b; text-align: center; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">THE BUILD METHOD</div>
    <div class="greeting">Velkommen, ${name}!</div>
    <div class="content">
      Din coach har inviteret dig til The Build Method platformen. 
      Her skal vi sammen optimere din træning, kost og livsstil for at nå dine mål.
    </div>
    
    <div class="credentials">
      <div style="margin-bottom: 15px;">
        <div class="credential-label">Login link</div>
        <div class="credential-value"><a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/login" style="color: #2563eb;">Login Portal</a></div>
      </div>
      <div style="margin-bottom: 15px;">
        <div class="credential-label">Email</div>
        <div class="credential-value">${email}</div>
      </div>
      <div>
        <div class="credential-label">Midlertidig kode</div>
        <div class="credential-value">${password}</div>
      </div>
    </div>

    <a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/login" class="button">Log ind og kom i gang</a>
    
    <div class="content" style="margin-top: 30px; font-size: 14px;">
      Når du logger ind første gang, vil du blive bedt om at skifte din kode og udfylde en kort onboarding profil.
    </div>

    <div class="footer">
      The Build Method &copy; ${new Date().getFullYear()}<br>
      High Performance Coaching
    </div>
  </div>
</body>
</html>
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    console.log("Function invoked - SUPABASE_URL:", supabaseUrl);
    console.log("Service Key defined:", !!serviceKey);

    const supabase = createClient(supabaseUrl, serviceKey);

    // Verify caller is a coach
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token received (first 10 chars):", token.substring(0, 10));

    const {
      data: { user: caller },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth error verifying token:", authError.message);
    }

    if (!caller) {
      console.error("No caller found for token");
      return new Response(JSON.stringify({ error: "Unauthorized - Token verification failed", details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Caller found:", caller.id, "email:", caller.email);

    const { data: callerProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", caller.id)
      .single();

    if (profileError) {
      console.error("Error fetching caller profile:", profileError.message);
    }

    if (callerProfile?.role !== "coach") {
      console.error("Caller is not a coach. Role:", callerProfile?.role);
      return new Response(JSON.stringify({ error: "Forbidden - Coach role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    
    if (!email) {
      return new Response(JSON.stringify({ error: "Email er påkrævet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const name = body.name?.trim() || email.split('@')[0];
    const phone = body.phone || null;
    const age = body.age ? parseInt(body.age) : null;
    
    let subscriptionStart: Date;
    try {
      subscriptionStart = new Date(body.startDate || new Date().toISOString().split('T')[0]);
      if (isNaN(subscriptionStart.getTime())) throw new Error("Invalid date");
    } catch (e) {
      console.error("Date parsing error:", e.message);
      subscriptionStart = new Date();
    }
    const startDate = subscriptionStart.toISOString().split('T')[0];

    const startWeight = body.startWeight ? parseFloat(body.startWeight) : null;
    const goalWeight = body.goalWeight ? parseFloat(body.goalWeight) : null;
    const primaryGoal = body.primaryGoal || "Ikke angivet";
    const packageType = body.packageType || "the_system";
    const alreadyPaid = body.alreadyPaid || false;

    console.log("Parsed data:", { name, email, age, startDate, packageType });

    const monthlyPrice = packageType === "build_method" ? 1500 : 1000;

    // Generate a random password
    const password = crypto.randomUUID().slice(0, 12) + "A1!";

    // Create auth user (or reuse existing)
    let userId: string;
    let isExistingUser = false;
    const { data: authData, error: creationError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name, role: "client" },
      });

    if (creationError) {
      if (creationError.message?.includes("already been registered")) {
        // Reuse existing user
        const { data: userData, error: fetchError } = await supabase.auth.admin.getUserByEmail(email);
        if (fetchError || !userData?.user) {
          console.error("User exists but couldn't be fetched:", fetchError?.message);
          return new Response(JSON.stringify({ error: "Bruger findes men kunne ikke hentes" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = userData.user.id;
        isExistingUser = true;

        // Reset password for the existing user
        await supabase.auth.admin.updateUserById(userId, {
          password,
          user_metadata: { full_name: name, role: "client" },
        });

        await supabase.from("profiles").upsert({
          id: userId,
          full_name: name,
          role: "client",
          phone,
          age: age,
          must_change_password: true,
        });

        // Check if client_profile already exists for this user + coach
        const { data: existingCp } = await supabase
          .from("client_profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("coach_id", caller.id)
          .maybeSingle();

        if (existingCp) {
          return new Response(JSON.stringify({ error: "Denne klient er allerede oprettet hos dig" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: creationError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      userId = authData.user.id;
    }

    if (!isExistingUser) {
      console.log("Updating profile for new user:", userId);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone, age: age, must_change_password: true })
        .eq("id", userId);
      
      if (updateError) {
        console.error("Profile update error:", updateError.message);
        throw updateError;
      }
    }

    // Calculate binding end (6 months)
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
        start_weight: startWeight,
        goal_weight: goalWeight,
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
        status: "active",
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

    // Fetch coach's custom default habits, fallback to system defaults
    const { data: coachHabits } = await supabase
      .from("coach_default_habits")
      .select("habit_name, habit_order")
      .eq("coach_id", caller.id)
      .order("habit_order", { ascending: true });

    const habitsToInsert =
      coachHabits && coachHabits.length > 0
        ? coachHabits.map((h) => ({
            client_id: clientId,
            habit_name: h.habit_name,
            habit_order: h.habit_order,
          }))
        : [
            { client_id: clientId, habit_name: "Drak 3L vand", habit_order: 1 },
            { client_id: clientId, habit_name: "Fulgte kostplan", habit_order: 2 },
            { client_id: clientId, habit_name: "Trænede i dag", habit_order: 3 },
            { client_id: clientId, habit_name: "8 timers søvn", habit_order: 4 },
            { client_id: clientId, habit_name: "Supplement taget", habit_order: 5 },
          ];

    await supabase.from("daily_habits").insert(habitsToInsert);

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

    // Send welcome email via Resend
    if (RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: Deno.env.get("FROM_EMAIL") || "Built By Borch <onboarding@resend.dev>",
            to: [email],
            subject: "Velkommen til The Build Method!",
            html: buildWelcomeHtml(name, email, password, callerProfile?.full_name || "Din Coach"),
          }),
        });

        await supabase.from("email_logs").insert({
          client_id: clientId,
          email_type: "welcome",
          recipient_email: email,
          subject: "Velkommen til The Build Method!",
          status: res.ok ? "sent" : "failed",
        });
      } catch (emailErr: any) {
        console.error("Welcome email failed:", emailErr.message);
      }
    }

    // Create Stripe checkout session
    let checkoutUrl = null;
    try {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const priceId = PRICES[packageType];

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

        const origin = req.headers.get("origin") || (Deno.env.get("SITE_URL") ?? "http://localhost:5173");

        // If already paid, add 30-day trial so first charge is skipped
        const trialEnd = alreadyPaid
          ? Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
          : undefined;

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
            ...(trialEnd ? { trial_end: trialEnd } : {}),
          },
        });

        checkoutUrl = session.url;
      }
    } catch (stripeErr: any) {
      console.error("Stripe checkout creation failed:", stripeErr.message);
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
