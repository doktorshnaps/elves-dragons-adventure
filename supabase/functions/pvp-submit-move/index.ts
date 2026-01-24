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

// D6 dice roll
const rollD6 = (): number => Math.floor(Math.random() * 6) + 1;

// Calculate damage based on dice rolls and power
const calculateDamage = (
  attackerRoll: number,
  defenderRoll: number,
  attackerPower: number,
  defenderDefense: number
): { damage: number; isBlocked: boolean; isCritical: boolean } => {
  // Critical hit on 6
  const isCritical = attackerRoll === 6;
  // Block on 6 (defender)
  const isBlocked = defenderRoll === 6;
  
  if (isBlocked) {
    return { damage: 0, isBlocked: true, isCritical: false };
  }
  
  // Base damage calculation: attacker power * roll modifier
  let rollModifier = 0.5 + (attackerRoll / 6) * 0.5; // 0.5 - 1.0 based on roll
  
  if (isCritical) {
    rollModifier = 1.5; // 50% bonus for critical
  }
  
  // Calculate raw damage
  let damage = Math.floor(attackerPower * rollModifier);
  
  // Apply defense reduction (defense reduces damage by percentage)
  const defenseReduction = Math.min(defenderDefense * 0.5, damage * 0.5); // Max 50% reduction
  damage = Math.max(1, Math.floor(damage - defenseReduction)); // Minimum 1 damage
  
  return { damage, isBlocked: false, isCritical };
};

// Apply damage to a pair (hero first, then dragon)
const applyDamageToPair = (pair: any, damage: number): any => {
  const updatedPair = JSON.parse(JSON.stringify(pair));
  let remainingDamage = damage;
  
  // Apply to hero defense first
  if (updatedPair.hero.currentDefense > 0) {
    const defenseAbsorbed = Math.min(updatedPair.hero.currentDefense, remainingDamage);
    updatedPair.hero.currentDefense -= defenseAbsorbed;
    remainingDamage -= defenseAbsorbed;
  }
  
  // Apply to hero health
  if (remainingDamage > 0) {
    updatedPair.hero.currentHealth = Math.max(0, updatedPair.hero.currentHealth - remainingDamage);
  }
  
  // Update totals
  updatedPair.currentDefense = (updatedPair.hero?.currentDefense || 0) + (updatedPair.dragon?.currentDefense || 0);
  updatedPair.currentHealth = (updatedPair.hero?.currentHealth || 0) + (updatedPair.dragon?.currentHealth || 0);
  
  return updatedPair;
};

// Check if a team is defeated
const isTeamDefeated = (pairs: any[]): boolean => {
  return pairs.every(pair => 
    pair.hero.currentHealth <= 0 && (!pair.dragon || pair.dragon.currentHealth <= 0)
  );
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { 
      match_id, 
      wallet_address, 
      action_type, 
      attacker_pair_index, 
      target_pair_index 
    } = body;

    const headerWallet = req.headers.get('x-wallet-address');
    const playerWallet = wallet_address || headerWallet;

    if (!match_id || !playerWallet) {
      return json({ error: 'match_id and wallet_address are required' }, 400);
    }

    if (!['attack', 'ability', 'surrender'].includes(action_type)) {
      return json({ error: 'Invalid action_type' }, 400);
    }

    const supabase = getSupabaseServiceClient();

    // Get match data
    const { data: match, error: matchError } = await supabase
      .from('pvp_matches')
      .select('*')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      console.error('❌ [PvP Move] Match not found:', matchError);
      return json({ error: 'Match not found' }, 404);
    }

    // Validate match is active
    if (match.status !== 'active') {
      return json({ error: 'Match is not active' }, 400);
    }

    // Validate it's the player's turn
    if (match.current_turn_wallet !== playerWallet) {
      return json({ error: 'Not your turn' }, 400);
    }

    // Determine player and opponent
    const isPlayer1 = playerWallet === match.player1_wallet;
    const battleState = match.battle_state || {};
    const playerPairs = isPlayer1 ? battleState.player1_pairs : battleState.player2_pairs;
    const opponentPairs = isPlayer1 ? battleState.player2_pairs : battleState.player1_pairs;

    // Handle surrender
    if (action_type === 'surrender') {
      const winnerWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;
      const loserWallet = playerWallet;
      
      const eloChange = 25;
      const reward = match.entry_fee * 2 * 0.9; // 10% fee
      
      // Update match as completed
      await supabase
        .from('pvp_matches')
        .update({
          status: 'completed',
          winner_wallet: winnerWallet,
          loser_wallet: loserWallet,
          elo_change: eloChange,
          winner_reward: reward,
          finished_at: new Date().toISOString()
        })
        .eq('id', match_id);

      // Update Elo ratings
      await supabase.rpc('update_pvp_elo', {
        p_winner_wallet: winnerWallet,
        p_loser_wallet: loserWallet,
        p_elo_change: eloChange
      });

      // Credit winner reward
      if (!winnerWallet.startsWith('BOT_')) {
        await supabase.rpc('add_ell_balance', {
          p_wallet_address: winnerWallet,
          p_amount: reward
        });
      }

      return json({
        success: true,
        match_status: 'completed',
        winner: winnerWallet,
        loser: loserWallet,
        elo_change: eloChange,
        reward: reward,
        action_type: 'surrender'
      });
    }

    // Validate attack indices
    if (attacker_pair_index === undefined || target_pair_index === undefined) {
      return json({ error: 'attacker_pair_index and target_pair_index are required for attack' }, 400);
    }

    if (attacker_pair_index < 0 || attacker_pair_index >= playerPairs.length) {
      return json({ error: 'Invalid attacker_pair_index' }, 400);
    }

    if (target_pair_index < 0 || target_pair_index >= opponentPairs.length) {
      return json({ error: 'Invalid target_pair_index' }, 400);
    }

    const attackerPair = playerPairs[attacker_pair_index];
    const targetPair = opponentPairs[target_pair_index];

    // Check attacker is alive
    if (attackerPair.hero.currentHealth <= 0) {
      return json({ error: 'Attacker is dead' }, 400);
    }

    // Check target is alive
    if (targetPair.hero.currentHealth <= 0) {
      return json({ error: 'Target is already dead' }, 400);
    }

    // Roll dice
    const attackerRoll = rollD6();
    const defenderRoll = rollD6();

    // Calculate damage
    const attackerTotalPower = attackerPair.totalPower || 
      (attackerPair.hero?.power || 0) + (attackerPair.dragon?.power || 0);
    const defenderTotalDefense = targetPair.currentDefense || 0;

    const { damage, isBlocked, isCritical } = calculateDamage(
      attackerRoll, 
      defenderRoll, 
      attackerTotalPower, 
      defenderTotalDefense
    );

    // Apply damage to target
    const updatedTargetPair = applyDamageToPair(targetPair, damage);
    
    // Update opponent pairs
    const updatedOpponentPairs = [...opponentPairs];
    updatedOpponentPairs[target_pair_index] = updatedTargetPair;

    // Update battle state
    const newTurnNumber = (battleState.turn_number || 1) + 1;
    const newBattleState = {
      ...battleState,
      turn_number: newTurnNumber,
      last_action: {
        action_type: 'attack',
        attacker_pair_index,
        target_pair_index,
        dice_roll_attacker: attackerRoll,
        dice_roll_defender: defenderRoll,
        damage_dealt: damage,
        is_blocked: isBlocked,
        is_critical: isCritical,
        timestamp: new Date().toISOString()
      }
    };

    // Update the correct pairs array
    if (isPlayer1) {
      newBattleState.player2_pairs = updatedOpponentPairs;
    } else {
      newBattleState.player1_pairs = updatedOpponentPairs;
    }

    // Check for victory
    const opponentDefeated = isTeamDefeated(updatedOpponentPairs);

    if (opponentDefeated) {
      // Match completed - attacker wins
      const winnerWallet = playerWallet;
      const loserWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;
      
      const eloChange = 25;
      const reward = match.entry_fee * 2 * 0.9; // 10% fee

      await supabase
        .from('pvp_matches')
        .update({
          status: 'completed',
          winner_wallet: winnerWallet,
          loser_wallet: loserWallet,
          elo_change: eloChange,
          winner_reward: reward,
          finished_at: new Date().toISOString(),
          battle_state: newBattleState
        })
        .eq('id', match_id);

      // Update Elo ratings
      await supabase.rpc('update_pvp_elo', {
        p_winner_wallet: winnerWallet,
        p_loser_wallet: loserWallet,
        p_elo_change: eloChange
      });

      // Credit winner reward (skip bots)
      if (!winnerWallet.startsWith('BOT_')) {
        await supabase.rpc('add_ell_balance', {
          p_wallet_address: winnerWallet,
          p_amount: reward
        });
      }

      // Record move
      await supabase.from('pvp_moves').insert({
        match_id,
        player_wallet: playerWallet,
        turn_number: newTurnNumber - 1,
        action_type: 'attack',
        attacker_pair_index,
        target_pair_index,
        dice_roll_attacker: attackerRoll,
        dice_roll_defender: defenderRoll,
        damage_dealt: damage,
        is_blocked: isBlocked,
        is_critical: isCritical,
        result_state: newBattleState
      });

      return json({
        success: true,
        match_status: 'completed',
        winner: winnerWallet,
        loser: loserWallet,
        elo_change: eloChange,
        reward: reward,
        dice_roll_attacker: attackerRoll,
        dice_roll_defender: defenderRoll,
        damage_dealt: damage,
        is_blocked: isBlocked,
        is_critical: isCritical
      });
    }

    // Match continues - switch turn
    const nextTurnWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;

    await supabase
      .from('pvp_matches')
      .update({
        current_turn_wallet: nextTurnWallet,
        turn_started_at: new Date().toISOString(),
        battle_state: newBattleState
      })
      .eq('id', match_id);

    // Record move
    await supabase.from('pvp_moves').insert({
      match_id,
      player_wallet: playerWallet,
      turn_number: newTurnNumber - 1,
      action_type: 'attack',
      attacker_pair_index,
      target_pair_index,
      dice_roll_attacker: attackerRoll,
      dice_roll_defender: defenderRoll,
      damage_dealt: damage,
      is_blocked: isBlocked,
      is_critical: isCritical,
      result_state: newBattleState
    });

    // For bot matches, process bot's turn automatically
    if (match.is_bot_match && nextTurnWallet.startsWith('BOT_')) {
      // Simple bot AI: attack a random alive target with first alive pair
      const botPairs = isPlayer1 ? newBattleState.player2_pairs : newBattleState.player1_pairs;
      const humanPairs = isPlayer1 ? newBattleState.player1_pairs : newBattleState.player2_pairs;
      
      const aliveBotPairIndex = botPairs.findIndex((p: any) => p.hero.currentHealth > 0);
      const aliveHumanPairIndex = humanPairs.findIndex((p: any) => p.hero.currentHealth > 0);

      if (aliveBotPairIndex >= 0 && aliveHumanPairIndex >= 0) {
        const botAttackerPair = botPairs[aliveBotPairIndex];
        const botTargetPair = humanPairs[aliveHumanPairIndex];

        const botAttackerRoll = rollD6();
        const botDefenderRoll = rollD6();

        const botAttackerPower = botAttackerPair.totalPower || 
          (botAttackerPair.hero?.power || 0) + (botAttackerPair.dragon?.power || 0);
        const botDefenderDefense = botTargetPair.currentDefense || 0;

        const botResult = calculateDamage(
          botAttackerRoll, 
          botDefenderRoll, 
          botAttackerPower, 
          botDefenderDefense
        );

        const updatedHumanPair = applyDamageToPair(botTargetPair, botResult.damage);
        const updatedHumanPairs = [...humanPairs];
        updatedHumanPairs[aliveHumanPairIndex] = updatedHumanPair;

        const botBattleState = {
          ...newBattleState,
          turn_number: newTurnNumber + 1,
          last_action: {
            action_type: 'attack',
            attacker_pair_index: aliveBotPairIndex,
            target_pair_index: aliveHumanPairIndex,
            dice_roll_attacker: botAttackerRoll,
            dice_roll_defender: botDefenderRoll,
            damage_dealt: botResult.damage,
            is_blocked: botResult.isBlocked,
            is_critical: botResult.isCritical,
            timestamp: new Date().toISOString()
          }
        };

        if (isPlayer1) {
          botBattleState.player1_pairs = updatedHumanPairs;
        } else {
          botBattleState.player2_pairs = updatedHumanPairs;
        }

        // Check if human is defeated
        const humanDefeated = isTeamDefeated(updatedHumanPairs);

        if (humanDefeated) {
          // Bot wins
          const eloChange = 25;

          await supabase
            .from('pvp_matches')
            .update({
              status: 'completed',
              winner_wallet: nextTurnWallet,
              loser_wallet: playerWallet,
              elo_change: eloChange,
              winner_reward: 0,
              finished_at: new Date().toISOString(),
              battle_state: botBattleState
            })
            .eq('id', match_id);

          // Update Elo - only for human player
          await supabase.rpc('update_pvp_elo', {
            p_winner_wallet: 'SKIP_BOT', // Don't update bot's rating
            p_loser_wallet: playerWallet,
            p_elo_change: eloChange
          });
        } else {
          // Match continues - back to human's turn
          await supabase
            .from('pvp_matches')
            .update({
              current_turn_wallet: playerWallet,
              turn_started_at: new Date().toISOString(),
              battle_state: botBattleState
            })
            .eq('id', match_id);
        }

        // Record bot move
        await supabase.from('pvp_moves').insert({
          match_id,
          player_wallet: nextTurnWallet,
          turn_number: newTurnNumber,
          action_type: 'attack',
          attacker_pair_index: aliveBotPairIndex,
          target_pair_index: aliveHumanPairIndex,
          dice_roll_attacker: botAttackerRoll,
          dice_roll_defender: botDefenderRoll,
          damage_dealt: botResult.damage,
          is_blocked: botResult.isBlocked,
          is_critical: botResult.isCritical,
          result_state: botBattleState
        });
      }
    }

    return json({
      success: true,
      match_status: 'active',
      dice_roll_attacker: attackerRoll,
      dice_roll_defender: defenderRoll,
      damage_dealt: damage,
      is_blocked: isBlocked,
      is_critical: isCritical,
      next_turn: nextTurnWallet
    });

  } catch (error) {
    console.error('❌ [PvP Move] Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});