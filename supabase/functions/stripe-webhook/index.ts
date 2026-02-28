import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2025-08-27.basil",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } }
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // If webhook secret is set, verify signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`[WEBHOOK] Processing: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clientProfileId = session.metadata?.client_profile_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (clientProfileId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const productId = subscription.items.data[0]?.price.product as string;
          const product = await stripe.products.retrieve(productId);

          // Upsert subscription record
          await supabase.from("subscriptions").upsert({
            client_id: clientProfileId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            product_name: product.name,
            status: "active",
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: "client_id" });

          // Update client profile status
          await supabase
            .from("client_profiles")
            .update({ subscription_status: "active" })
            .eq("id", clientProfileId);

          // Log payment event
          await supabase.from("payment_events").insert({
            client_id: clientProfileId,
            event_type: "checkout.session.completed",
            stripe_event_id: event.id,
            amount_dkk: (session.amount_total || 0) / 100,
            status: "paid",
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        // Find client by subscription
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("client_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (sub) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          await supabase
            .from("client_profiles")
            .update({ subscription_status: "active" })
            .eq("id", sub.client_id);

          await supabase.from("payment_events").insert({
            client_id: sub.client_id,
            stripe_invoice_id: invoice.id,
            stripe_event_id: event.id,
            event_type: "invoice.payment_succeeded",
            amount_dkk: (invoice.amount_paid || 0) / 100,
            status: "paid",
            invoice_pdf_url: invoice.invoice_pdf || null,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const { data: sub } = await supabase
          .from("subscriptions")
          .select("client_id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subscriptionId);

          await supabase
            .from("client_profiles")
            .update({ subscription_status: "past_due" })
            .eq("id", sub.client_id);

          await supabase.from("payment_events").insert({
            client_id: sub.client_id,
            stripe_invoice_id: invoice.id,
            stripe_event_id: event.id,
            event_type: "invoice.payment_failed",
            amount_dkk: (invoice.amount_due || 0) / 100,
            status: "failed",
            failure_reason: invoice.last_finalization_error?.message || "Payment failed",
          });

          // Notify coach
          const { data: coachProfile } = await supabase
            .from("client_profiles")
            .select("coach_id")
            .eq("id", sub.client_id)
            .single();

          if (coachProfile) {
            await supabase.from("notifications").insert({
              user_id: coachProfile.coach_id,
              type: "payment_failed",
              title: "Betaling fejlet",
              body: `En klient har en mislykket betaling. Tjek betalingsoversigten.`,
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("client_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          const status = subscription.status === "active" ? "active" :
                         subscription.status === "past_due" ? "past_due" :
                         subscription.status === "canceled" ? "canceled" : subscription.status;

          // Get payment method info
          let last4: string | null = null;
          let brand: string | null = null;
          if (subscription.default_payment_method) {
            const pm = await stripe.paymentMethods.retrieve(subscription.default_payment_method as string);
            last4 = pm.card?.last4 || null;
            brand = pm.card?.brand || null;
          }

          await supabase
            .from("subscriptions")
            .update({
              status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              payment_method_last4: last4,
              payment_method_brand: brand,
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          await supabase
            .from("client_profiles")
            .update({ subscription_status: status })
            .eq("id", sub.client_id);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("client_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          await supabase
            .from("client_profiles")
            .update({ subscription_status: "cancelled" })
            .eq("id", sub.client_id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[WEBHOOK] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
