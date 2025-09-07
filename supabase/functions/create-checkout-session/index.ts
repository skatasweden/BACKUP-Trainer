import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@16.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Server-controlled price mapping - NEVER trust client prices!
const PRICE_MAP: Record<string, { price_id?: string; amount: number; currency: string; name: string }> = {
  // Program ID mappings - you can update these based on your programs
  // Using amount in öre (Swedish currency) since the client was using SEK
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required environment variables");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  try {
    // Authenticate user
    const auth = req.headers.get("Authorization") ?? "";
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, { 
      global: { headers: { Authorization: auth } } 
    });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    const { program_id } = await req.json();
    if (!program_id) {
      return new Response(JSON.stringify({ error: "program_id is required" }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    // Get program details from database (server-side source of truth)
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: program, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, name, price, currency')
      .eq('id', program_id)
      .single();

    if (programError || !program) {
      return new Response(JSON.stringify({ error: "Program not found" }), { 
        status: 404,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    if (!program.price || program.price <= 0) {
      return new Response(JSON.stringify({ error: "Program has no valid price" }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    // Convert price to smallest currency unit (öre for SEK)
    const currency = program.currency || 'sek';
    const amountInSmallestUnit = Math.round(program.price * 100);

    // Validate minimum amount (Stripe requires at least 3.00 SEK = 300 öre)
    if (currency === 'sek' && amountInSmallestUnit < 300) {
      return new Response(JSON.stringify({ 
        error: `Price must be at least 3.00 SEK. Current: ${program.price} SEK` 
      }), { 
        status: 400,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    const origin = req.headers.get("origin") || new URL(req.url).origin;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: program.name,
            description: `Access to ${program.name} training program`,
          },
          unit_amount: amountInSmallestUnit,
        },
        quantity: 1,
      }],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&program_id=${program_id}`,
      cancel_url: `${origin}/payment/cancel?program_id=${program_id}`,
      metadata: {
        user_id: user.id,
        program_id: program_id,
      },
      // Ensure customer email is set
      customer_email: user.email,
    });

    console.log(`[CHECKOUT] Created session ${session.id} for user ${user.id}, program ${program_id}`);

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });

  } catch (error) {
    console.error("[CHECKOUT] Error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal error", 
      detail: error instanceof Error ? error.message : String(error) 
    }), { 
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" }
    });
  }
});