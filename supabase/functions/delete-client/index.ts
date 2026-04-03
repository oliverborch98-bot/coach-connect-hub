import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is a coach
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user: caller },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "coach") {
      return new Response(JSON.stringify({ error: "Forbidden - Coach role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { clientId } = await req.json();

    if (!clientId) {
      return new Response(JSON.stringify({ error: "Missing clientId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user_id associated with this client_profile
    const { data: clientProfile, error: fetchError } = await supabaseAdmin
      .from("client_profiles")
      .select("user_id, coach_id")
      .eq("id", clientId)
      .single();

    if (fetchError || !clientProfile) {
      return new Response(JSON.stringify({ error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security check: coach can only delete their own clients
    if (clientProfile.coach_id !== caller.id) {
       return new Response(JSON.stringify({ error: "Forbidden - Not your client" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = clientProfile.user_id;

    console.log(`Deleting client ${clientId} (User: ${userId})`);

    // 1. Delete the client_profile (cascades handle related tables)
    const { error: deleteCpError } = await supabaseAdmin
      .from("client_profiles")
      .delete()
      .eq("id", clientId);

    if (deleteCpError) {
      throw deleteCpError;
    }

    // 2. Check if the user is a client and has NO other client profiles (unlikely but safe)
    const { count: otherProfiles } = await supabaseAdmin
      .from("client_profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    if (!otherProfiles || otherProfiles === 0) {
      // 3. Delete the public.profile
      const { error: deleteProfileError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);
      
      if (deleteProfileError) {
        console.error("Error deleting public profile:", deleteProfileError.message);
      }

      // 4. Delete the auth.user
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError.message);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Client and user deleted successfully" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Delete client error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
