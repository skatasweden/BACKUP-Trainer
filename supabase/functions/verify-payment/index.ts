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

  // Use service role key to bypass RLS for creating program access
  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Parse request body
    const { sessionId } = await req.json();
    console.log(`[VERIFY-PAYMENT] Verifying session: ${sessionId}`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(`[VERIFY-PAYMENT] Session status: ${session.payment_status}`);

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Get program and user details from session metadata
    const programId = session.metadata?.program_id;
    const userId = session.metadata?.user_id;

    if (!programId || !userId) {
      throw new Error("Missing program or user information in session metadata");
    }

    console.log(`[VERIFY-PAYMENT] Creating program access for user ${userId}, program ${programId}`);

    // Check if access already exists to prevent duplicates
    const { data: existingAccess } = await supabaseService
      .from("program_access")
      .select("id")
      .eq("user_id", userId)
      .eq("program_id", programId)
      .eq("access_type", "purchased")
      .maybeSingle();

    if (existingAccess) {
      console.log(`[VERIFY-PAYMENT] Access already exists, skipping creation`);
      return new Response(JSON.stringify({ 
        success: true,
        message: "Program access already granted"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create program access record
    const { error: accessError } = await supabaseService
      .from("program_access")
      .insert({
        user_id: userId,
        program_id: programId,
        access_type: "purchased",
        stripe_session_id: sessionId,
        created_at: new Date().toISOString(),
      });

    if (accessError) {
      console.error(`[VERIFY-PAYMENT] Error creating access: ${accessError.message}`);
      throw accessError;
    }

    console.log(`[VERIFY-PAYMENT] Program access successfully created`);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Program access granted successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error(`[VERIFY-PAYMENT] Error: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});