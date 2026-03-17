import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Require JWT and resolve wallet server-side
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", authData.user.id)
      .single();

    const walletAddress = profile?.wallet_address;
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: "No wallet linked to this account" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin check via RPC using server-resolved wallet
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      "is_admin_or_super_wallet",
      { p_wallet_address: walletAddress }
    );

    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const operation = body?.operation as string | undefined;
    const monsterId = body?.monsterId as string | undefined;
    const isActive = body?.isActive as boolean | undefined;
    const monster = body?.monster as {
      monster_id: string;
      monster_name: string;
      monster_type: string;
      description?: string | null;
      image_url?: string | null;
    } | undefined;

    // Handle different operations
    if (operation === 'create') {
      if (!monster?.monster_id || !monster?.monster_name || !monster?.monster_type) {
        return new Response(
          JSON.stringify({ error: "Missing required monster fields" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("monsters")
        .insert({
          monster_id: monster.monster_id,
          monster_name: monster.monster_name,
          monster_type: monster.monster_type,
          description: monster.description ?? null,
          image_url: monster.image_url ?? null,
          created_by_wallet_address: walletAddress,
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ monster: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (operation === 'update') {
      if (!monsterId || !monster?.monster_id || !monster?.monster_name || !monster?.monster_type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for update" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("monsters")
        .update({
          monster_id: monster.monster_id,
          monster_name: monster.monster_name,
          monster_type: monster.monster_type,
          description: monster.description ?? null,
          image_url: monster.image_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", monsterId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ monster: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (operation === 'delete') {
      if (!monsterId) {
        return new Response(
          JSON.stringify({ error: "Missing monster ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("monsters")
        .delete()
        .eq("id", monsterId);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (operation === 'toggle_active') {
      if (!monsterId || isActive === undefined) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for toggle" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("monsters")
        .update({ 
          is_active: isActive, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", monsterId)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ monster: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid operation" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
