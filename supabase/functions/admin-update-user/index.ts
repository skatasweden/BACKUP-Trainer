// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`${req.method} ${req.url}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { 
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing bearer token" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Verifying user authentication...");

    // 1) Verify the caller using anon key but forwarding token
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      console.error("Authentication failed:", userErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`User authenticated: ${user.email}, ID: ${user.id}`);

    // 2) RBAC - only coaches with the right flag
    const role = (user.app_metadata as any)?.role;
    const canManage = Boolean((user.app_metadata as any)?.can_manage_users);
    
    console.log(`User role: ${role}, can manage users: ${canManage}`);
    
    if (role !== "coach" || !canManage) {
      console.log("Access denied: insufficient permissions");
      return new Response(JSON.stringify({ error: "Forbidden - requires coach role with user management permissions" }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3) Read and validate payload
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));
    
    const { user_id, email, phone, password, app_metadata, user_metadata, action } = payload ?? {};
    
    if (!user_id || typeof user_id !== "string") {
      return new Response(JSON.stringify({ error: "user_id is required" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4) Initialize admin client with service role
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Handle delete action separately
    if (action === "delete") {
      console.log(`Deleting user: ${user_id}`);
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) {
        console.error("Delete user error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Log audit
      console.log(`User ${user_id} deleted by ${user.id}`);

      return new Response(JSON.stringify({ success: true, message: "User deleted successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build update object for user updates
    const update: any = {};
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (password) update.password = password;
    if (app_metadata && typeof app_metadata === "object") update.app_metadata = app_metadata;
    if (user_metadata && typeof user_metadata === "object") update.user_metadata = user_metadata;

    console.log("Update object:", JSON.stringify(update, null, 2));

    // 5) Perform admin update with service_role
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user_id, update);
    if (error) {
      console.error("Update user error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Update profiles table if email changed
    if (email) {
      console.log("Updating profiles table with new email");
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ email })
        .eq('user_id', user_id);

      if (profileError) {
        console.error("Profile update error:", profileError);
        // Don't fail the request, just log the error
      }
    }

    console.log(`User ${user_id} updated successfully by ${user.id}`);

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Internal error:", e);
    return new Response(JSON.stringify({ error: "Internal error", detail: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});