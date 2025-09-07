import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create Supabase client using the anon key for user authentication
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Retrieve authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    console.log(`[CREATE-PAYMENT] User authenticated: ${user.email}`);

    // Parse request body
    const { programId, programName, price } = await req.json();
    console.log(`[CREATE-PAYMENT] Request received for program: ${programName}, price: ${price} öre`);
    
    // Validate request data
    if (!programId || !programName) {
      throw new Error(`Missing required data: programId=${programId}, programName=${programName}`);
    }
    
    // Validate price format and minimum amount
    if (!Number.isInteger(price) || price < 300) {
      console.error(`[CREATE-PAYMENT] Invalid price: ${price}. Expected: integer >= 300 öre (3.00 SEK)`);
      throw new Error(`Invalid price: ${price}. Must be integer >= 300 öre (3.00 SEK)`);
    }
    
    console.log(`[CREATE-PAYMENT] Price validation passed: ${price} öre = ${(price / 100).toFixed(2)} SEK`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Check if a Stripe customer record exists for this user
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`[CREATE-PAYMENT] Found existing customer: ${customerId}`);
    } else {
      console.log(`[CREATE-PAYMENT] No existing customer found for ${user.email}`);
    }

    const origin = req.headers.get("origin") || "https://liftflow-builder.lovable.app";

    // Create a one-time payment session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "sek",
            product_data: { 
              name: programName,
              description: `Träningsprogram: ${programName}`
            },
            unit_amount: price, // Already in öre (cents)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&program_id=${programId}`,
      cancel_url: `${origin}/athlete/programs`,
      metadata: {
        program_id: programId,
        user_id: user.id,
      },
    });

    console.log(`[CREATE-PAYMENT] Checkout session created: ${session.id}`);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[CREATE-PAYMENT] Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});