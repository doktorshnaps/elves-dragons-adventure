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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get('match_id');
    const walletAddress = req.headers.get('x-wallet-address');

    if (!matchId) {
      return json({ error: 'match_id is required' }, 400);
    }

    const supabase = getSupabaseServiceClient();

    // Get match data
    const { data: match, error: matchError } = await supabase
      .from('pvp_matches')
      .select(`
        *,
        player1_rating:pvp_ratings!pvp_matches_player1_wallet_fkey(elo, tier, wins, losses),
        player2_rating:pvp_ratings!pvp_matches_player2_wallet_fkey(elo, tier, wins, losses)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return json({ error: 'Match not found' }, 404);
    }

    // Calculate time remaining for current turn
    let timeRemaining = null;
    if (match.status === 'active' && match.turn_started_at) {
      const turnStarted = new Date(match.turn_started_at).getTime();
      const elapsed = (Date.now() - turnStarted) / 1000;
      timeRemaining = Math.max(0, match.turn_timeout_seconds - elapsed);
    }

    // Determine if it's the requesting player's turn
    const isMyTurn = walletAddress && match.current_turn_wallet === walletAddress;
    const amIPlayer1 = walletAddress === match.player1_wallet;

    // Get recent moves for this match
    const { data: recentMoves } = await supabase
      .from('pvp_moves')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(5);

    return json({
      match_id: match.id,
      status: match.status,
      current_turn: match.current_turn_wallet,
      is_my_turn: isMyTurn,
      time_remaining: timeRemaining ? Math.floor(timeRemaining) : null,
      turn_number: match.battle_state?.turn_number || 1,
      
      player1: {
        wallet: match.player1_wallet,
        pairs: match.battle_state?.player1_pairs || [],
        elo: match.player1_elo_before,
        is_me: amIPlayer1,
      },
      player2: {
        wallet: match.player2_wallet,
        pairs: match.battle_state?.player2_pairs || [],
        elo: match.player2_elo_before,
        is_me: !amIPlayer1 && walletAddress === match.player2_wallet,
      },
      
      last_action: match.battle_state?.last_action || null,
      recent_moves: recentMoves || [],
      
      winner: match.winner_wallet,
      loser: match.loser_wallet,
      elo_change: match.elo_change,
      reward: match.winner_reward,
      
      rarity_tier: match.rarity_tier,
      entry_fee: match.entry_fee,
      started_at: match.started_at,
      finished_at: match.finished_at,
    });

  } catch (error) {
    console.error('❌ [PvP Status] Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
