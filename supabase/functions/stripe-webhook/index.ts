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

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildPaymentFailedHtml(clientName: string, amount: number): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px">
    <div style="padding:24px 32px;border-bottom:2px solid #D4A853">
      <h1 style="margin:0;color:#D4A853;font-size:20px;font-weight:700;letter-spacing:1px">BUILT BY BORCH</h1>
    </div>
    <div style="padding:32px;color:#e0e0e0;font-size:14px;line-height:1.6">
      <h2 style="color:#ff6b6b;font-size:18px;margin-top:0">Betalingsfejl</h2>
      <p>Hej ${clientName},</p>
      <p>Din seneste betaling på <strong>${amount} DKK</strong> kunne desværre ikke gennemføres.</p>
      <p>Opdater venligst din betalingsmetode for at undgå afbrydelse af dit forløb.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${Deno.env.get('SITE_URL') ?? 'http://localhost:5173'}/client" style="display:inline-block;padding:12px 32px;background:#D4A853;color:#1a1a2e;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">Opdater betaling</a>
      </div>
      <p style="color:#888;font-size:13px">Har du spørgsmål? Kontakt mig direkte på platformen.</p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #2a2a4a;text-align:center">
      <p style="margin:0;color:#666;font-size:11px">Oliver Borch · Built By Borch</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendPaymentFailedEmails(clientId: string, amountDkk: number) {
  if (!RESEND_API_KEY) return;

  try {
    // Get client info
    const { data: cp } = await supabase
      .from("client_profiles")
      .select("user_id, coach_id")
      .eq("id", clientId)
      .single();
    if (!cp) return;

    const { data: clientAuth } = await supabase.auth.admin.getUserById(cp.user_id);
    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", cp.user_id)
      .single();

    const clientEmail = clientAuth?.user?.email;
    const clientName = clientProfile?.full_name ?? "Klient";

    // Send to client
    if (clientEmail) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL") || "Built By Borch <onboarding@resend.dev>",
          to: [clientEmail],
          subject: "Betalingsfejl — handling påkrævet",
          html: buildPaymentFailedHtml(clientName, amountDkk),
        }),
      });

      await supabase.from("email_logs").insert({
        client_id: clientId,
        email_type: "payment_failed",
        recipient_email: clientEmail,
        subject: "Betalingsfejl — handling påkrævet",
        status: res.ok ? "sent" : "failed",
      });
    }

    // Notify coach via email
    const { data: coachAuth } = await supabase.auth.admin.getUserById(cp.coach_id);
    if (coachAuth?.user?.email) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("FROM_EMAIL") || "Built By Borch <onboarding@resend.dev>",
          to: [coachAuth.user.email],
          subject: `Betalingsfejl: ${clientName}`,
          html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0f1a;font-family:system-ui,sans-serif">
  <div style="max-width:600px;margin:24px auto;background:#1a1a2e;border-radius:12px;overflow:hidden">
    <div style="padding:24px 32px;border-bottom:2px solid #D4A853">
      <h1 style="margin:0;color:#D4A853;font-size:20px;letter-spacing:1px">BUILT BY BORCH</h1>
    </div>
    <div style="padding:32px;color:#e0e0e0;font-size:14px;line-height:1.6">
      <h2 style="color:#ff6b6b;margin-top:0">Betalingsfejl for ${clientName}</h2>
      <p>Beløb: <strong>${amountDkk} DKK</strong></p>
      <p>Tjek betalingsoversigten for detaljer.</p>
    </div>
  </div>
</body></html>`,
        }),
      });
    }
  } catch (err: any) {
    console.error("Payment failed email error:", err.message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret || !sig) {
      console.error("[WEBHOOK] Missing signature or secret");
      throw new Error("Missing stripe-signature or STRIPE_WEBHOOK_SECRET");
    }

    let event: Stripe.Event;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    console.log(`[WEBHOOK] Processing: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('metadata:', session.metadata);
        
        const clientProfileId = session.metadata?.client_profile_id;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (clientProfileId && subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const productId = subscription.items.data[0]?.price.product as string;
          const product = await stripe.products.retrieve(productId);

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

          await supabase
            .from("client_profiles")
            .update({ subscription_status: "active" })
            .eq("id", clientProfileId);

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

          const amountDkk = (invoice.amount_due || 0) / 100;

          await supabase.from("payment_events").insert({
            client_id: sub.client_id,
            stripe_invoice_id: invoice.id,
            stripe_event_id: event.id,
            event_type: "invoice.payment_failed",
            amount_dkk: amountDkk,
            status: "failed",
            failure_reason: invoice.last_finalization_error?.message || "Payment failed",
          });

          // Notify coach in-app
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

          // Send payment failed emails to client + coach
          await sendPaymentFailedEmails(sub.client_id, amountDkk);
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
