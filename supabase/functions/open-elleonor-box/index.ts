import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Possible reward amounts with their weights
const REWARD_CONFIG = [
  { amount: 1, weight: 35 },
  { amount: 5, weight: 25 },
  { amount: 10, weight: 15 },
  { amount: 15, weight: 10 },
  { amount: 20, weight: 7 },
  { amount: 50, weight: 4 },
  { amount: 100, weight: 2.5 },
  { amount: 1000, weight: 1 },
  { amount: 6666, weight: 0.5 },
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address, box_instance_id, count = 1 } = await req.json();
    
    console.log(`📦 Opening Elleonor Box for wallet: ${wallet_address}, box_id: ${box_instance_id}, count: ${count}`);

    if (!wallet_address) {
      throw new Error("wallet_address is required");
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find consumable boxes for this wallet
    const { data: boxes, error: fetchError } = await supabaseAdmin
      .from('item_instances')
      .select('id, name, template_id, wallet_address')
      .eq('wallet_address', wallet_address)
      .eq('type', 'consumable')
      .limit(count);

    if (fetchError) {
      console.error('Error fetching boxes:', fetchError);
      throw new Error('Не удалось найти сундуки в инвентаре');
    }

    if (!boxes || boxes.length === 0) {
      throw new Error('У вас нет сундуков Эллеонор');
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

    return new Response(
      JSON.stringify({
        success: true,
        boxesOpened: boxesToOpen.length,
        rewards,
        totalReward,
        newBalance,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error opening Elleonor Box:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to open Elleonor Box",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
