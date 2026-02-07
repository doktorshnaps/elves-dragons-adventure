import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const getSupabaseServiceClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};

const MAX_TIMEOUTS = 2; // After 2 timeouts, player auto-loses

async function finalizeMatchByTimeout(
  supabase: any,
  match: any,
  winnerId: string
) {
  const loserId = winnerId === match.player1_wallet ? match.player2_wallet : match.player1_wallet;
  const reward = match.entry_fee * 2 - 10;

  // Dynamic Elo — delegated entirely to DB function
  const { data: eloChange, error: eloError } = await supabase.rpc('update_pvp_elo', {
    p_winner_wallet: winnerId,
    p_loser_wallet: loserId,
  });

  if (eloError) {
    console.error('Error updating Elo:', eloError);
  }

  const finalEloChange = eloChange ?? 16;

  console.log(`🏆 [PvP Timeout] ${winnerId.substring(0, 10)} wins by timeout forfeit (+${finalEloChange} ELO)`);

  // Update match
  await supabase
    .from('pvp_matches')
    .update({
      status: 'completed',
      winner_wallet: winnerId,
      loser_wallet: loserId,
      elo_change: finalEloChange,
      winner_reward: reward,
      finished_at: new Date().toISOString(),
    })
    .eq('id', match.id);

  // Award winner
  if (!winnerId.startsWith('BOT_')) {
    await supabase.rpc('add_ell_balance', {
      p_wallet_address: winnerId,
      p_amount: reward,
    });
  }

  return { winnerId, loserId, eloChange: finalEloChange };
}

async function skipTurnByTimeout(
  supabase: any,
  match: any,
  timedOutWallet: string
) {
  const battleState = match.battle_state || {};
  const timeoutWarnings = battleState.timeout_warnings || { player1: 0, player2: 0 };
  
  // Determine which player timed out
  const isPlayer1 = timedOutWallet === match.player1_wallet;
  const playerKey = isPlayer1 ? 'player1' : 'player2';
  
  // Increment warning count
  timeoutWarnings[playerKey] = (timeoutWarnings[playerKey] || 0) + 1;
  const warningCount = timeoutWarnings[playerKey];
  
  console.log(`⏰ [PvP Timeout] Player ${timedOutWallet.substring(0, 10)} timeout #${warningCount}`);
  
  // Check if player exceeded max timeouts
  if (warningCount >= MAX_TIMEOUTS) {
    // Auto-lose: opponent wins
    const winnerId = isPlayer1 ? match.player2_wallet : match.player1_wallet;
    
    // Save warnings to battle_state before finalizing
    const updatedBattleState = { ...battleState, timeout_warnings: timeoutWarnings };
    await supabase
      .from('pvp_matches')
      .update({ battle_state: updatedBattleState })
      .eq('id', match.id);
    
    const result = await finalizeMatchByTimeout(supabase, match, winnerId);
    return {
      action: 'forfeit',
      warning_count: warningCount,
      winner: result.winnerId,
      loser: result.loserId,
      elo_change: result.eloChange,
    };
  }
  
  // Skip turn: switch to opponent
  const nextTurnWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;
  const updatedBattleState = {
    ...battleState,
    timeout_warnings: timeoutWarnings,
    last_action: {
      ...(battleState.last_action || {}),
      action_type: 'timeout_skip',
      skipped_wallet: timedOutWallet,
      warning_count: warningCount,
      timestamp: new Date().toISOString(),
    },
  };
  
  await supabase
    .from('pvp_matches')
    .update({
      current_turn_wallet: nextTurnWallet,
      turn_started_at: new Date().toISOString(),
      battle_state: updatedBattleState,
    })
    .eq('id', match.id);
  
  // Record the skip as a move
  await supabase.from('pvp_moves').insert({
    match_id: match.id,
    player_wallet: timedOutWallet,
    turn_number: battleState.turn_number || 1,
    action_type: 'timeout_skip',
    attacker_pair_index: null,
    target_pair_index: null,
    dice_roll_attacker: null,
    dice_roll_defender: null,
    damage_dealt: 0,
    is_blocked: false,
    is_critical: false,
    result_state: updatedBattleState,
  });
  
  return {
    action: 'skip',
    warning_count: warningCount,
    next_turn: nextTurnWallet,
  };
}

async function processMatchTimeout(supabase: any, match: any) {
  const timedOutWallet = match.current_turn_wallet;
  
  // For bot matches where bot timed out, this shouldn't happen
  // but handle gracefully by skipping bot's turn
  const isBotTimedOut = timedOutWallet?.startsWith('BOT_');
  if (isBotTimedOut) {
    // Just skip bot's turn without warnings
    const humanWallet = match.player1_wallet.startsWith('BOT_') 
      ? match.player2_wallet 
      : match.player1_wallet;
    
    await supabase
      .from('pvp_matches')
      .update({
        current_turn_wallet: humanWallet,
        turn_started_at: new Date().toISOString(),
      })
      .eq('id', match.id);
    
    return { action: 'bot_skip', next_turn: humanWallet };
  }
  
  return await skipTurnByTimeout(supabase, match, timedOutWallet);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseServiceClient();
    const body = await req.json().catch(() => ({}));
    const matchId = body.match_id;

    console.log('⏰ [PvP Timeout] Processing timeout check');

    // If specific match_id provided, check only that match
    if (matchId) {
      const { data: match, error: matchError } = await supabase
        .from('pvp_matches')
        .select('*')
        .eq('id', matchId)
        .eq('status', 'active')
        .single();

      if (matchError || !match) {
        return json({ error: 'Match not found or not active' }, 404);
      }

      const turnStarted = new Date(match.turn_started_at).getTime();
      const timeElapsed = (Date.now() - turnStarted) / 1000;

      if (timeElapsed <= match.turn_timeout_seconds) {
        return json({ 
          message: 'Turn not timed out yet',
          time_remaining: Math.floor(match.turn_timeout_seconds - timeElapsed)
        });
      }

      const result = await processMatchTimeout(supabase, match);
      
      return json({
        success: true,
        match_id: matchId,
        ...result,
      });
    }

    // Batch process all timed out matches
    const { data: timedOutMatches, error: queryError } = await supabase
      .from('pvp_matches')
      .select('*')
      .eq('status', 'active')
      .not('turn_started_at', 'is', null);

    if (queryError) {
      console.error('Error querying matches:', queryError);
      return json({ error: 'Failed to query matches' }, 500);
    }

    const processedMatches: any[] = [];
    const now = Date.now();

    for (const match of timedOutMatches || []) {
      const turnStarted = new Date(match.turn_started_at).getTime();
      const timeElapsed = (now - turnStarted) / 1000;

      if (timeElapsed > match.turn_timeout_seconds) {
        try {
          const result = await processMatchTimeout(supabase, match);
          processedMatches.push({
            match_id: match.id,
            ...result,
          });
        } catch (err) {
          console.error(`Error processing timeout for match ${match.id}:`, err);
        }
      }
    }

    console.log(`⏰ [PvP Timeout] Processed ${processedMatches.length} timed out matches`);

    return json({
      success: true,
      processed_count: processedMatches.length,
      matches: processedMatches,
    });

  } catch (error) {
    console.error('❌ [PvP Timeout] Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
