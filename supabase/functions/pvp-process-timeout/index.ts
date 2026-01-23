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

function getTierFromElo(elo: number): string {
  if (elo >= 2200) return 'legend';
  if (elo >= 2000) return 'master';
  if (elo >= 1800) return 'diamond';
  if (elo >= 1600) return 'platinum';
  if (elo >= 1400) return 'gold';
  if (elo >= 1200) return 'silver';
  return 'bronze';
}

async function finalizeMatchByTimeout(
  supabase: any,
  match: any,
  winnerId: string
) {
  const loserId = winnerId === match.player1_wallet ? match.player2_wallet : match.player1_wallet;
  const winnerElo = winnerId === match.player1_wallet ? match.player1_elo_before : match.player2_elo_before;
  const loserElo = winnerId === match.player1_wallet ? match.player2_elo_before : match.player1_elo_before;

  // Calculate ELO change
  const { data: eloSettings } = await supabase
    .from('pvp_settings')
    .select('setting_value')
    .eq('setting_key', 'elo_change')
    .single();
  
  const kFactor = eloSettings?.setting_value?.win || 24;
  const expectedWin = 1.0 / (1.0 + Math.pow(10, (loserElo - winnerElo) / 400.0));
  const eloChange = Math.max(1, Math.min(kFactor, Math.round(kFactor * (1.0 - expectedWin))));

  console.log(`🏆 [PvP Timeout] ${winnerId.substring(0, 10)} wins by timeout (+${eloChange} ELO)`);

  // Update match
  await supabase
    .from('pvp_matches')
    .update({
      status: 'completed',
      winner_wallet: winnerId,
      loser_wallet: loserId,
      elo_change: eloChange,
      winner_reward: match.entry_fee * 2 - 10,
      finished_at: new Date().toISOString(),
    })
    .eq('id', match.id);

  // Update winner rating
  const newWinnerElo = winnerElo + eloChange;
  const { error: winnerError } = await supabase
    .from('pvp_ratings')
    .update({
      elo: newWinnerElo,
      tier: getTierFromElo(newWinnerElo),
      wins: supabase.sql`wins + 1`,
      win_streak: supabase.sql`win_streak + 1`,
      matches_played: supabase.sql`matches_played + 1`,
    })
    .eq('wallet_address', winnerId)
    .eq('season_id', match.season_id);

  if (winnerError) {
    console.error('Error updating winner rating:', winnerError);
  }

  // Update loser rating  
  const newLoserElo = Math.max(0, loserElo - eloChange);
  const { error: loserError } = await supabase
    .from('pvp_ratings')
    .update({
      elo: newLoserElo,
      tier: getTierFromElo(newLoserElo),
      losses: supabase.sql`losses + 1`,
      win_streak: 0,
      matches_played: supabase.sql`matches_played + 1`,
    })
    .eq('wallet_address', loserId)
    .eq('season_id', match.season_id);

  if (loserError) {
    console.error('Error updating loser rating:', loserError);
  }

  // Award winner
  await supabase.rpc('update_game_data_by_wallet_v2', {
    p_wallet_address: winnerId,
    p_updates: { balance_add: match.entry_fee * 2 - 10 },
  });

  return { winnerId, loserId, eloChange };
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
