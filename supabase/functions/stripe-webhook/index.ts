import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const sig = req.headers.get("Stripe-Signature");
  if (!sig) {
    console.error("[WEBHOOK] Missing Stripe-Signature header");
    return new Response("Missing signature", { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    console.log(`[WEBHOOK] Verified event: ${event.type} (${event.id})`);
  } catch (err) {
    console.error("[WEBHOOK] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    // Check for idempotency - prevent duplicate processing
    const { data: existingLog } = await supabaseAdmin
      .from("payments_log")
      .select("event_id")
      .eq("event_id", event.id)
      .maybeSingle();

    if (existingLog) {
      console.log(`[WEBHOOK] Event ${event.id} already processed`);
      return new Response("Event already processed", { status: 200 });
    }

    // Process different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[WEBHOOK] Processing checkout.session.completed: ${session.id}`);
        
        const user_id = session.metadata?.user_id;
        const program_id = session.metadata?.program_id;

        if (!user_id || !program_id) {
          console.error("[WEBHOOK] Missing metadata:", { user_id, program_id });
          throw new Error("Missing required metadata");
        }

        if (session.payment_status === "paid") {
          console.log(`[WEBHOOK] Payment confirmed for user ${user_id}, program ${program_id}`);
          
          // Grant program access (idempotent upsert)
          const { error: accessError } = await supabaseAdmin
            .from("program_access")
            .upsert({
              user_id,
              program_id,
              access_type: "purchased",
              stripe_session_id: session.id,
              source: "stripe",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: "user_id,program_id",
              ignoreDuplicates: false 
            });

          if (accessError) {
            console.error("[WEBHOOK] Failed to grant access:", accessError);
            throw accessError;
          }

          console.log(`[WEBHOOK] Successfully granted access to user ${user_id} for program ${program_id}`);
        } else {
          console.log(`[WEBHOOK] Payment not completed. Status: ${session.payment_status}`);
        }

        // Log the event for audit trail
        const { error: logError } = await supabaseAdmin
          .from("payments_log")
          .insert({
            event_id: event.id,
            user_id,
            program_id,
            type: event.type,
            amount_total: session.amount_total,
            currency: session.currency,
            stripe_session_id: session.id,
            created_at: new Date().toISOString(),
          });

        if (logError) {
          console.error("[WEBHOOK] Failed to log event:", logError);
          throw logError;
        }

        break;
      }

      case "invoice.paid": {
        // Handle subscription payments if needed in the future
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[WEBHOOK] Invoice paid: ${invoice.id}`);
        
        // Log the event
        await supabaseAdmin
          .from("payments_log")
          .insert({
            event_id: event.id,
            user_id: invoice.metadata?.user_id || null,
            program_id: invoice.metadata?.program_id || null,
            type: event.type,
            amount_total: invoice.amount_paid,
            currency: invoice.currency,
            created_at: new Date().toISOString(),
          });

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        // Handle subscription events if needed in the future
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[WEBHOOK] Subscription ${event.type}: ${subscription.id}`);
        
        // Log the event
        await supabaseAdmin
          .from("payments_log")
          .insert({
            event_id: event.id,
            user_id: subscription.metadata?.user_id || null,
            program_id: subscription.metadata?.program_id || null,
            type: event.type,
            created_at: new Date().toISOString(),
          });

        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
        
        // Still log unknown events for debugging
        await supabaseAdmin
          .from("payments_log")
          .insert({
            event_id: event.id,
            type: event.type,
            created_at: new Date().toISOString(),
          });
        
        break;
    }

    console.log(`[WEBHOOK] Successfully processed event ${event.id}`);
    return new Response("Webhook processed successfully", { status: 200 });

  } catch (error) {
    console.error(`[WEBHOOK] Error processing event ${event.id}:`, error);
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed", 
      detail: error instanceof Error ? error.message : String(error) 
    }), { 
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});