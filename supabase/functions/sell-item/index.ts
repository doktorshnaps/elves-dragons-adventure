import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SellItemSchema = z.object({
  item_instance_id: z.string().uuid(),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 JWT verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user via JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return json({ success: false, error: "Invalid token" }, 401);
    }

    const userId = user.id;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Resolve wallet from profiles
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile?.wallet_address) {
      return json({ success: false, error: "No wallet linked" }, 403);
    }

    const wallet_address = profile.wallet_address;

    // Parse input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid request body" }, 400);
    }

    const parseResult = SellItemSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ success: false, error: "Invalid parameters" }, 400);
    }

    const { item_instance_id } = parseResult.data;

    // 🔒 Verify item ownership AND get template for sell_price
    const { data: itemInstance, error: itemErr } = await supabaseAdmin
      .from("item_instances")
      .select("id, wallet_address, template_id, name, type")
      .eq("id", item_instance_id)
      .single();

    if (itemErr || !itemInstance) {
      return json({ success: false, error: "Item not found" }, 404);
    }

    if (itemInstance.wallet_address !== wallet_address) {
      console.warn(`🚫 Sell attempt: wallet ${wallet_address} tried to sell item owned by ${itemInstance.wallet_address}`);
      await supabaseAdmin.from("security_audit_log").insert({
        event_type: "SELL_ITEM_WRONG_OWNER",
        wallet_address,
        details: { item_instance_id, actual_owner: itemInstance.wallet_address },
      });
      return json({ success: false, error: "Not your item" }, 403);
    }

    // Get sell_price from item_templates
    let sellPrice = 1; // minimum fallback
    if (itemInstance.template_id) {
      const { data: template } = await supabaseAdmin
        .from("item_templates")
        .select("sell_price, value")
        .eq("id", itemInstance.template_id)
        .single();

      if (template) {
        sellPrice = template.sell_price ?? Math.floor((template.value ?? 1) * 0.7);
      }
    }

    // Ensure minimum sell price
    sellPrice = Math.max(1, sellPrice);

    // 🔒 Atomically: delete item + add balance
    // Step 1: Delete item
    const { error: deleteErr } = await supabaseAdmin
      .from("item_instances")
      .delete()
      .eq("id", item_instance_id)
      .eq("wallet_address", wallet_address); // double-check ownership

    if (deleteErr) {
      console.error("❌ Error deleting item:", deleteErr);
      return json({ success: false, error: "Failed to delete item" }, 500);
    }

    // Step 2: Add balance via atomic RPC (negative deduction = add)
    const { data: balanceResult, error: balanceErr } = await supabaseAdmin.rpc("atomic_balance_update", {
      p_wallet_address: wallet_address,
      p_price_deduction: -sellPrice, // negative = add balance
    });

    if (balanceErr) {
      console.error("❌ Error updating balance:", balanceErr);
      // Item already deleted — log for manual recovery
      await supabaseAdmin.from("security_audit_log").insert({
        event_type: "SELL_ITEM_BALANCE_FAILED",
        wallet_address,
        details: { item_instance_id, sellPrice, error: balanceErr.message },
      });
      return json({ success: false, error: "Balance update failed" }, 500);
    }

    const newBalance = typeof balanceResult === "object" && balanceResult !== null
      ? (balanceResult as any).new_balance ?? null
      : null;

    console.log(`✅ Sold item ${item_instance_id} for ${sellPrice} ELL (wallet: ${wallet_address})`);

    return json({
      success: true,
      sellPrice,
      newBalance,
    });
  } catch (error) {
    console.error("Error selling item:", error);
    return json({ success: false, error: "Internal server error" }, 500);
  }
});
