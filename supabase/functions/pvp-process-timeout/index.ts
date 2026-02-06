import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  console.log(`🏆 [PvP Timeout] ${winnerId.substring(0, 10)} wins by timeout (+${finalEloChange} ELO)`);

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

      // Determine winner (opponent of current turn player)
      const winnerId = match.current_turn_wallet === match.player1_wallet 
        ? match.player2_wallet 
        : match.player1_wallet;

      const result = await finalizeMatchByTimeout(supabase, match, winnerId);
      
      return json({
        success: true,
        match_id: matchId,
        winner: winnerId,
        reason: 'timeout',
        elo_change: result.eloChange,
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
        const winnerId = match.current_turn_wallet === match.player1_wallet 
          ? match.player2_wallet 
          : match.player1_wallet;

        try {
          const result = await finalizeMatchByTimeout(supabase, match, winnerId);
          processedMatches.push({
            match_id: match.id,
            winner: winnerId,
            loser: result.loserId,
            elo_change: result.eloChange,
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
