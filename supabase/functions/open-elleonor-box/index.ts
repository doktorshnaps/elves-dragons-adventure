import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🔒 Input validation schema
const OpenBoxSchema = z.object({
  wallet_address: z.string().min(3).max(100),
  box_instance_id: z.string().optional(),
  count: z.number().int().min(1).max(10).default(1),
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 box openings per minute

// Possible reward amounts with their weights (total = 100%)
const REWARD_CONFIG = [
  { amount: 1, weight: 70 },
  { amount: 5, weight: 20 },
  { amount: 10, weight: 6 },
  { amount: 15, weight: 2 },
  { amount: 20, weight: 1 },
  { amount: 50, weight: 0.5 },
  { amount: 100, weight: 0.3 },
  { amount: 1000, weight: 0.15 },
  { amount: 6666, weight: 0.05 },
];

// Calculate reward based on weighted random
function calculateReward(): number {
  const totalWeight = REWARD_CONFIG.reduce((sum, r) => sum + r.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const reward of REWARD_CONFIG) {
    random -= reward.weight;
    if (random <= 0) {
      return reward.amount;
    }
  }
  
  return REWARD_CONFIG[0].amount;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 🔒 Parse and validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid request body" }, 400);
    }

    const parseResult = OpenBoxSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("❌ Validation error:", parseResult.error.flatten());
      return json({ success: false, error: "Invalid request parameters" }, 400);
    }

    const { wallet_address, count } = parseResult.data;
    console.log(`📦 Opening Elleonor Box for wallet: ${wallet_address}, count: ${count}`);

    // Create Supabase client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // 🔒 SECURITY: Verify wallet exists in game_data (proves ownership)
    const { data: gameDataCheck, error: verifyError } = await supabaseAdmin
      .from('game_data')
      .select('wallet_address')
      .eq('wallet_address', wallet_address)
      .single();

    if (verifyError || !gameDataCheck) {
      console.error('❌ Wallet verification failed:', verifyError);
      await supabaseAdmin.from('security_audit_log').insert({
        event_type: 'BOX_OPEN_UNVERIFIED_WALLET',
        wallet_address,
        details: { count, error: 'Wallet not registered' }
      });
      return json({ success: false, error: 'Wallet not verified' }, 401);
    }

    // 🔒 SECURITY: Check rate limiting
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_api_rate_limit', {
      p_identifier: wallet_address,
      p_endpoint: 'open-elleonor-box',
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS
    });

    if (!rateLimitOk) {
      console.warn(`🚫 Rate limit exceeded for wallet: ${wallet_address}`);
      await supabaseAdmin.from('security_audit_log').insert({
        event_type: 'BOX_OPEN_RATE_LIMITED',
        wallet_address,
        details: { count }
      });
      return json({ 
        success: false, 
        error: 'Too many requests. Please wait a moment.' 
      }, 429);
    }

    // Find consumable boxes for this wallet
    const { data: boxes, error: fetchError } = await supabaseAdmin
      .from('item_instances')
      .select('id, name, template_id, wallet_address')
      .eq('wallet_address', wallet_address)
      .eq('type', 'consumable')
      .limit(count);

    if (fetchError) {
      console.error('Error fetching boxes:', fetchError);
      return json({ success: false, error: 'Не удалось найти сундуки в инвентаре' }, 500);
    }

    if (!boxes || boxes.length === 0) {
      return json({ success: false, error: 'У вас нет сундуков Эллеонор' }, 400);
    }

    const boxesToOpen = boxes.slice(0, count);
    console.log(`Found ${boxesToOpen.length} boxes to open`);

    let totalReward = 0;
    const rewards: number[] = [];

    // Delete boxes and calculate rewards
    for (const box of boxesToOpen) {
      const reward = calculateReward();
      totalReward += reward;
      rewards.push(reward);

      // Delete the box
      const { error: deleteError } = await supabaseAdmin
        .from('item_instances')
        .delete()
        .eq('id', box.id);

      if (deleteError) {
        console.error(`Error deleting box ${box.id}:`, deleteError);
        // Continue with other boxes
      }

      // Log the claim
      await supabaseAdmin
        .from('mgt_claims')
        .insert({
          wallet_address,
          amount: reward,
          claim_type: 'box_opening',
          source_item_id: box.id,
        });
    }

    // Get current mGT balance AFTER processing all boxes
    const { data: gameData, error: gameDataError } = await supabaseAdmin
      .from('game_data')
      .select('mgt_balance')
      .eq('wallet_address', wallet_address)
      .maybeSingle();

    if (gameDataError) {
      console.error('Error fetching game_data:', gameDataError);
    }

    const currentBalance = Number(gameData?.mgt_balance) || 0;
    const newBalance = currentBalance + totalReward;

    console.log(`💰 Updating mGT balance: ${currentBalance} + ${totalReward} = ${newBalance}`);

    if (gameData) {
      const { error: updateError } = await supabaseAdmin
        .from('game_data')
        .update({ mgt_balance: newBalance })
        .eq('wallet_address', wallet_address);
      
      if (updateError) {
        console.error('Error updating mgt_balance:', updateError);
      }
    }

    console.log(`✅ Opened ${boxesToOpen.length} boxes, total reward: ${totalReward} mGT`);

    return json({
      success: true,
      boxesOpened: boxesToOpen.length,
      rewards,
      totalReward,
      newBalance,
    });
  } catch (error) {
    console.error("Error opening Elleonor Box:", error);
    return json({
      success: false,
      error: error.message || "Failed to open Elleonor Box",
    }, 400);
  }
});
