import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const walletAddress = body?.walletAddress as string | undefined;
    const monster = body?.monster as {
      monster_id: string;
      monster_name: string;
      monster_type: string;
      description?: string | null;
      image_url?: string | null;
    } | undefined;

    if (!walletAddress || !monster?.monster_id || !monster?.monster_name || !monster?.monster_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin check via RPC
    const { data: isAdmin, error: adminError } = await supabase.rpc(
      "is_admin_or_super_wallet",
      { p_wallet_address: walletAddress }
    );

    if (adminError || !isAdmin) {
      console.error("Admin check failed:", adminError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert monster
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
      console.error("Insert monster error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ monster: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Unhandled error:", e);
    return new Response(
      JSON.stringify({ error: e?.message || "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
