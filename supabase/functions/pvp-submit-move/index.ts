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

// New D6 damage system (only attacker rolls):
// 1 - Critical miss, opponent counterattacks
// 2 - Miss (0 damage)
// 3 - Weak hit (50% damage)
// 4 - Normal hit (100% damage)
// 5 - Strong hit (150% damage)
// 6 - Critical hit (200% damage)
const calculateDamageByRoll = (
  roll: number,
  attackerPower: number,
  defenderDefense: number
): { damage: number; damagePercent: number; isCounterAttack: boolean; isCritical: boolean; isMiss: boolean; description: string } => {
  let damagePercent = 0;
  let isCounterAttack = false;
  let isCritical = false;
  let isMiss = false;
  let description = '';

  switch (roll) {
    case 1:
      damagePercent = 0;
      isCounterAttack = true;
      isMiss = true;
      description = 'Критический промах! Противник контратакует';
      break;
    case 2:
      damagePercent = 0;
      isMiss = true;
      description = 'Промах!';
      break;
    case 3:
      damagePercent = 50;
      description = 'Слабый удар (50% урона)';
      break;
    case 4:
      damagePercent = 100;
      description = 'Нормальный удар (100% урона)';
      break;
    case 5:
      damagePercent = 150;
      description = 'Сильный удар (150% урона)';
      break;
    case 6:
      damagePercent = 200;
      isCritical = true;
      description = 'Критический удар! (200% урона)';
      break;
  }

  // Calculate base damage: attackerPower - defenderDefense, minimum 1
  const baseDamage = Math.max(1, attackerPower - defenderDefense);
  
  // Apply percentage
  const damage = isMiss ? 0 : Math.floor(baseDamage * (damagePercent / 100));

  return { 
    damage, 
    damagePercent,
    isCounterAttack, 
    isCritical, 
    isMiss,
    description
  };
};

// Apply damage to a pair (hero HP first, then dragon HP)
// Defense is already factored into damage calculation formula (attackerPower - defenderDefense)
// So here we just reduce HP directly
const applyDamageToPair = (pair: any, damage: number): any => {
  const updatedPair = JSON.parse(JSON.stringify(pair));
  let remainingDamage = damage;
  
  // Apply damage to hero HP first (defense already calculated in damage formula)
  if (updatedPair.hero && updatedPair.hero.currentHealth > 0) {
    const heroAbsorbed = Math.min(updatedPair.hero.currentHealth, remainingDamage);
    updatedPair.hero.currentHealth = Math.max(0, updatedPair.hero.currentHealth - heroAbsorbed);
    remainingDamage -= heroAbsorbed;
  }
  
  // If hero is dead and damage remains, apply to dragon HP
  if (remainingDamage > 0 && updatedPair.dragon && updatedPair.dragon.currentHealth > 0) {
    updatedPair.dragon.currentHealth = Math.max(0, updatedPair.dragon.currentHealth - remainingDamage);
  }
  
  // Update pair totals
  updatedPair.currentHealth = (updatedPair.hero?.currentHealth || 0) + (updatedPair.dragon?.currentHealth || 0);
  // Defense doesn't change during combat (it's used for damage calculation, not absorption)
  
  return updatedPair;
};

// Check if a team is defeated (pair is alive if hero OR dragon has health)
const isTeamDefeated = (pairs: any[]): boolean => {
  return pairs.every(pair => {
    const heroAlive = pair.hero && pair.hero.currentHealth > 0;
    const dragonAlive = pair.dragon && pair.dragon.currentHealth > 0;
    return !heroAlive && !dragonAlive;
  });
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

    if (!['attack', 'ability', 'surrender', 'trigger_bot_turn'].includes(action_type)) {
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

    // Determine player and opponent
    const isPlayer1 = playerWallet === match.player1_wallet;
    const isPlayer2 = playerWallet === match.player2_wallet;
    
    // Validate player is in this match
    if (!isPlayer1 && !isPlayer2) {
      return json({ error: 'You are not in this match' }, 400);
    }
    
    const battleState = match.battle_state || {};
    const playerPairs = isPlayer1 ? battleState.player1_pairs : battleState.player2_pairs;
    const opponentPairs = isPlayer1 ? battleState.player2_pairs : battleState.player1_pairs;

    // Handle surrender - allowed regardless of whose turn it is
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

    // Handle trigger_bot_turn - execute bot's move when it's bot's turn
    if (action_type === 'trigger_bot_turn') {
      // Validate this is a bot match and it's the bot's turn
      if (!match.is_bot_match) {
        return json({ error: 'Not a bot match' }, 400);
      }
      
      const botWallet = match.player1_wallet.startsWith('BOT_') ? match.player1_wallet : match.player2_wallet;
      if (match.current_turn_wallet !== botWallet) {
        return json({ error: 'Not bot turn' }, 400);
      }
      
      const isBot1 = match.player1_wallet.startsWith('BOT_');
      const botPairs = isBot1 ? battleState.player1_pairs : battleState.player2_pairs;
      const humanPairs = isBot1 ? battleState.player2_pairs : battleState.player1_pairs;
      const humanWallet = isBot1 ? match.player2_wallet : match.player1_wallet;
      
      // Find first alive bot pair and first alive human pair
      const aliveBotPairIndex = botPairs.findIndex((p: any) => 
        (p.hero && p.hero.currentHealth > 0) || (p.dragon && p.dragon.currentHealth > 0)
      );
      const aliveHumanPairIndex = humanPairs.findIndex((p: any) => 
        (p.hero && p.hero.currentHealth > 0) || (p.dragon && p.dragon.currentHealth > 0)
      );
      
      if (aliveBotPairIndex < 0 || aliveHumanPairIndex < 0) {
        return json({ error: 'No valid targets' }, 400);
      }
      
      const botAttackerPair = botPairs[aliveBotPairIndex];
      const botTargetPair = humanPairs[aliveHumanPairIndex];
      
      // Bot rolls dice
      const botAttackerRoll = rollD6();
      
      const botAttackerPower = botAttackerPair.totalPower || 
        (botAttackerPair.hero?.power || 0) + (botAttackerPair.dragon?.power || 0);
      const botDefenderDefense = botTargetPair.currentDefense || 0;
      
      const botResult = calculateDamageByRoll(
        botAttackerRoll, 
        botAttackerPower, 
        botDefenderDefense
      );
      
      let updatedHumanPairs = [...humanPairs];
      let updatedBotPairs = [...botPairs];
      
      if (botResult.damage > 0) {
        const updatedHumanPair = applyDamageToPair(botTargetPair, botResult.damage);
        updatedHumanPairs[aliveHumanPairIndex] = updatedHumanPair;
      }
      
      // Handle bot counterattack (if bot rolled 1)
      let botCounterDamage = 0;
      if (botResult.isCounterAttack) {
        const counterRoll = rollD6();
        const targetPower = botTargetPair.totalPower || 
          (botTargetPair.hero?.power || 0) + (botTargetPair.dragon?.power || 0);
        const botDefense = botAttackerPair.currentDefense || 0;
        
        const counterResult = calculateDamageByRoll(counterRoll, targetPower, botDefense);
        if (counterResult.damage > 0) {
          const updatedBotPair = applyDamageToPair(botAttackerPair, counterResult.damage);
          updatedBotPairs[aliveBotPairIndex] = updatedBotPair;
          botCounterDamage = counterResult.damage;
        }
      }
      
      const newTurnNumber = (battleState.turn_number || 1) + 1;
      const botBattleState = {
        ...battleState,
        turn_number: newTurnNumber,
        last_action: {
          action_type: 'attack',
          attacker_pair_index: aliveBotPairIndex,
          target_pair_index: aliveHumanPairIndex,
          dice_roll: botAttackerRoll,
          damage_dealt: botResult.damage,
          damage_percent: botResult.damagePercent,
          is_miss: botResult.isMiss,
          is_critical: botResult.isCritical,
          is_counter_attack: botResult.isCounterAttack,
          counter_attack_damage: botCounterDamage,
          description: botResult.description,
          timestamp: new Date().toISOString()
        }
      };
      
      if (isBot1) {
        botBattleState.player1_pairs = updatedBotPairs;
        botBattleState.player2_pairs = updatedHumanPairs;
      } else {
        botBattleState.player1_pairs = updatedHumanPairs;
        botBattleState.player2_pairs = updatedBotPairs;
      }
      
      // Check if human is defeated
      const humanDefeated = isTeamDefeated(updatedHumanPairs);
      const botDefeated = isTeamDefeated(updatedBotPairs);
      
      if (humanDefeated) {
        // Bot wins
        const eloChange = 25;
        
        await supabase
          .from('pvp_matches')
          .update({
            status: 'completed',
            winner_wallet: botWallet,
            loser_wallet: humanWallet,
            elo_change: eloChange,
            winner_reward: 0,
            finished_at: new Date().toISOString(),
            battle_state: botBattleState
          })
          .eq('id', match_id);
        
        // Update Elo - only for human player
        await supabase.rpc('update_pvp_elo', {
          p_winner_wallet: 'SKIP_BOT',
          p_loser_wallet: humanWallet,
          p_elo_change: eloChange
        });
        
        // Record move
        await supabase.from('pvp_moves').insert({
          match_id,
          player_wallet: botWallet,
          turn_number: newTurnNumber - 1,
          action_type: 'attack',
          attacker_pair_index: aliveBotPairIndex,
          target_pair_index: aliveHumanPairIndex,
          dice_roll_attacker: botAttackerRoll,
          dice_roll_defender: null,
          damage_dealt: botResult.damage,
          is_blocked: false,
          is_critical: botResult.isCritical,
          result_state: botBattleState
        });
        
        return json({
          success: true,
          match_status: 'completed',
          winner: botWallet,
          loser: humanWallet,
          elo_change: eloChange,
          dice_roll: botAttackerRoll,
          damage_dealt: botResult.damage,
          damage_percent: botResult.damagePercent,
          is_miss: botResult.isMiss,
          is_critical: botResult.isCritical,
          is_counter_attack: botResult.isCounterAttack,
          counter_attack_damage: botCounterDamage,
          description: botResult.description
        });
      }
      
      if (botDefeated) {
        // Human wins due to counterattack
        const eloChange = 25;
        const reward = match.entry_fee * 2 * 0.9;
        
        await supabase
          .from('pvp_matches')
          .update({
            status: 'completed',
            winner_wallet: humanWallet,
            loser_wallet: botWallet,
            elo_change: eloChange,
            winner_reward: reward,
            finished_at: new Date().toISOString(),
            battle_state: botBattleState
          })
          .eq('id', match_id);
        
        await supabase.rpc('update_pvp_elo', {
          p_winner_wallet: humanWallet,
          p_loser_wallet: 'SKIP_BOT',
          p_elo_change: eloChange
        });
        
        await supabase.rpc('add_ell_balance', {
          p_wallet_address: humanWallet,
          p_amount: reward
        });
        
        // Record move
        await supabase.from('pvp_moves').insert({
          match_id,
          player_wallet: botWallet,
          turn_number: newTurnNumber - 1,
          action_type: 'attack',
          attacker_pair_index: aliveBotPairIndex,
          target_pair_index: aliveHumanPairIndex,
          dice_roll_attacker: botAttackerRoll,
          dice_roll_defender: null,
          damage_dealt: botResult.damage,
          is_blocked: false,
          is_critical: botResult.isCritical,
          result_state: botBattleState
        });
        
        return json({
          success: true,
          match_status: 'completed',
          winner: humanWallet,
          loser: botWallet,
          elo_change: eloChange,
          reward: reward,
          dice_roll: botAttackerRoll,
          damage_dealt: botResult.damage,
          damage_percent: botResult.damagePercent,
          is_miss: botResult.isMiss,
          is_critical: botResult.isCritical,
          is_counter_attack: botResult.isCounterAttack,
          counter_attack_damage: botCounterDamage,
          description: botResult.description
        });
      }
      
      // Match continues - switch to human's turn
      await supabase
        .from('pvp_matches')
        .update({
          current_turn_wallet: humanWallet,
          turn_started_at: new Date().toISOString(),
          battle_state: botBattleState
        })
        .eq('id', match_id);
      
      // Record bot move
      await supabase.from('pvp_moves').insert({
        match_id,
        player_wallet: botWallet,
        turn_number: newTurnNumber - 1,
        action_type: 'attack',
        attacker_pair_index: aliveBotPairIndex,
        target_pair_index: aliveHumanPairIndex,
        dice_roll_attacker: botAttackerRoll,
        dice_roll_defender: null,
        damage_dealt: botResult.damage,
        is_blocked: false,
        is_critical: botResult.isCritical,
        result_state: botBattleState
      });
      
      return json({
        success: true,
        match_status: 'active',
        dice_roll: botAttackerRoll,
        damage_dealt: botResult.damage,
        damage_percent: botResult.damagePercent,
        is_miss: botResult.isMiss,
        is_critical: botResult.isCritical,
        is_counter_attack: botResult.isCounterAttack,
        counter_attack_damage: botCounterDamage,
        description: botResult.description,
        next_turn: humanWallet
      });
    }

    // For attack action, validate it's the player's turn
    if (match.current_turn_wallet !== playerWallet) {
      return json({ error: 'Not your turn' }, 400);
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

    // Check attacker is alive (pair is alive if hero OR dragon has health)
    const attackerAlive = attackerPair.hero.currentHealth > 0 || 
      (attackerPair.dragon && attackerPair.dragon.currentHealth > 0);
    if (!attackerAlive) {
      return json({ error: 'Attacker is dead' }, 400);
    }

    // Check target is alive (pair is alive if hero OR dragon has health)
    const targetAlive = targetPair.hero.currentHealth > 0 || 
      (targetPair.dragon && targetPair.dragon.currentHealth > 0);
    if (!targetAlive) {
      return json({ error: 'Target is already dead' }, 400);
    }

    // Roll dice (only attacker rolls now)
    const attackerRoll = rollD6();

    // Calculate damage using new D6 system
    const attackerTotalPower = attackerPair.totalPower || 
      (attackerPair.hero?.power || 0) + (attackerPair.dragon?.power || 0);
    const defenderTotalDefense = targetPair.currentDefense || 0;

    const attackResult = calculateDamageByRoll(
      attackerRoll, 
      attackerTotalPower, 
      defenderTotalDefense
    );

    // Apply damage to target
    let updatedOpponentPairs = [...opponentPairs];
    let updatedPlayerPairs = [...playerPairs];
    
    if (attackResult.damage > 0) {
      const updatedTargetPair = applyDamageToPair(targetPair, attackResult.damage);
      updatedOpponentPairs[target_pair_index] = updatedTargetPair;
    }

    // Handle counterattack on roll 1
    let counterAttackDamage = 0;
    if (attackResult.isCounterAttack) {
      // Target counterattacks the attacker
      const counterRoll = rollD6();
      const targetTotalPower = targetPair.totalPower || 
        (targetPair.hero?.power || 0) + (targetPair.dragon?.power || 0);
      const attackerTotalDefense = attackerPair.currentDefense || 0;
      
      const counterResult = calculateDamageByRoll(
        counterRoll,
        targetTotalPower,
        attackerTotalDefense
      );
      
      if (counterResult.damage > 0) {
        const updatedAttackerPair = applyDamageToPair(attackerPair, counterResult.damage);
        updatedPlayerPairs[attacker_pair_index] = updatedAttackerPair;
        counterAttackDamage = counterResult.damage;
      }
    }

    // Update battle state
    const newTurnNumber = (battleState.turn_number || 1) + 1;
    const newBattleState = {
      ...battleState,
      turn_number: newTurnNumber,
      last_action: {
        action_type: 'attack',
        attacker_pair_index,
        target_pair_index,
        dice_roll: attackerRoll,
        damage_dealt: attackResult.damage,
        damage_percent: attackResult.damagePercent,
        is_miss: attackResult.isMiss,
        is_critical: attackResult.isCritical,
        is_counter_attack: attackResult.isCounterAttack,
        counter_attack_damage: counterAttackDamage,
        description: attackResult.description,
        timestamp: new Date().toISOString()
      }
    };

    // Update the pairs arrays
    if (isPlayer1) {
      newBattleState.player1_pairs = updatedPlayerPairs;
      newBattleState.player2_pairs = updatedOpponentPairs;
    } else {
      newBattleState.player1_pairs = updatedOpponentPairs;
      newBattleState.player2_pairs = updatedPlayerPairs;
    }

    // Check for victory
    const opponentDefeated = isTeamDefeated(updatedOpponentPairs);
    const playerDefeated = isTeamDefeated(updatedPlayerPairs);

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
        dice_roll_defender: null,
        damage_dealt: attackResult.damage,
        is_blocked: false,
        is_critical: attackResult.isCritical,
        result_state: newBattleState
      });

      return json({
        success: true,
        match_status: 'completed',
        winner: winnerWallet,
        loser: loserWallet,
        elo_change: eloChange,
        reward: reward,
        dice_roll: attackerRoll,
        damage_dealt: attackResult.damage,
        damage_percent: attackResult.damagePercent,
        is_miss: attackResult.isMiss,
        is_critical: attackResult.isCritical,
        is_counter_attack: attackResult.isCounterAttack,
        counter_attack_damage: counterAttackDamage,
        description: attackResult.description
      });
    }

    if (playerDefeated) {
      // Attacker lost due to counterattack
      const winnerWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;
      const loserWallet = playerWallet;
      
      const eloChange = 25;
      const reward = match.entry_fee * 2 * 0.9;

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

      await supabase.rpc('update_pvp_elo', {
        p_winner_wallet: winnerWallet,
        p_loser_wallet: loserWallet,
        p_elo_change: eloChange
      });

      if (!winnerWallet.startsWith('BOT_')) {
        await supabase.rpc('add_ell_balance', {
          p_wallet_address: winnerWallet,
          p_amount: reward
        });
      }

      await supabase.from('pvp_moves').insert({
        match_id,
        player_wallet: playerWallet,
        turn_number: newTurnNumber - 1,
        action_type: 'attack',
        attacker_pair_index,
        target_pair_index,
        dice_roll_attacker: attackerRoll,
        dice_roll_defender: null,
        damage_dealt: attackResult.damage,
        is_blocked: false,
        is_critical: attackResult.isCritical,
        result_state: newBattleState
      });

      return json({
        success: true,
        match_status: 'completed',
        winner: winnerWallet,
        loser: loserWallet,
        elo_change: eloChange,
        reward: 0,
        dice_roll: attackerRoll,
        damage_dealt: attackResult.damage,
        damage_percent: attackResult.damagePercent,
        is_miss: attackResult.isMiss,
        is_critical: attackResult.isCritical,
        is_counter_attack: attackResult.isCounterAttack,
        counter_attack_damage: counterAttackDamage,
        description: attackResult.description
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
      dice_roll_defender: null,
      damage_dealt: attackResult.damage,
      is_blocked: false,
      is_critical: attackResult.isCritical,
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

        // Bot rolls dice
        const botAttackerRoll = rollD6();

        const botAttackerPower = botAttackerPair.totalPower || 
          (botAttackerPair.hero?.power || 0) + (botAttackerPair.dragon?.power || 0);
        const botDefenderDefense = botTargetPair.currentDefense || 0;

        const botResult = calculateDamageByRoll(
          botAttackerRoll, 
          botAttackerPower, 
          botDefenderDefense
        );

        let updatedHumanPairs = [...humanPairs];
        let updatedBotPairs = [...botPairs];
        
        if (botResult.damage > 0) {
          const updatedHumanPair = applyDamageToPair(botTargetPair, botResult.damage);
          updatedHumanPairs[aliveHumanPairIndex] = updatedHumanPair;
        }

        // Handle bot counterattack (if bot rolled 1)
        let botCounterDamage = 0;
        if (botResult.isCounterAttack) {
          const counterRoll = rollD6();
          const targetPower = botTargetPair.totalPower || 
            (botTargetPair.hero?.power || 0) + (botTargetPair.dragon?.power || 0);
          const botDefense = botAttackerPair.currentDefense || 0;
          
          const counterResult = calculateDamageByRoll(counterRoll, targetPower, botDefense);
          if (counterResult.damage > 0) {
            const updatedBotPair = applyDamageToPair(botAttackerPair, counterResult.damage);
            updatedBotPairs[aliveBotPairIndex] = updatedBotPair;
            botCounterDamage = counterResult.damage;
          }
        }

        const botBattleState = {
          ...newBattleState,
          turn_number: newTurnNumber + 1,
          last_action: {
            action_type: 'attack',
            attacker_pair_index: aliveBotPairIndex,
            target_pair_index: aliveHumanPairIndex,
            dice_roll: botAttackerRoll,
            damage_dealt: botResult.damage,
            damage_percent: botResult.damagePercent,
            is_miss: botResult.isMiss,
            is_critical: botResult.isCritical,
            is_counter_attack: botResult.isCounterAttack,
            counter_attack_damage: botCounterDamage,
            description: botResult.description,
            timestamp: new Date().toISOString()
          }
        };

        if (isPlayer1) {
          botBattleState.player1_pairs = updatedHumanPairs;
          botBattleState.player2_pairs = updatedBotPairs;
        } else {
          botBattleState.player1_pairs = updatedBotPairs;
          botBattleState.player2_pairs = updatedHumanPairs;
        }

        // Check if human is defeated
        const humanDefeated = isTeamDefeated(updatedHumanPairs);
        const botDefeated = isTeamDefeated(updatedBotPairs);

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
        } else if (botDefeated) {
          // Human wins due to counterattack
          const eloChange = 25;
          const reward = match.entry_fee * 2 * 0.9;

          await supabase
            .from('pvp_matches')
            .update({
              status: 'completed',
              winner_wallet: playerWallet,
              loser_wallet: nextTurnWallet,
              elo_change: eloChange,
              winner_reward: reward,
              finished_at: new Date().toISOString(),
              battle_state: botBattleState
            })
            .eq('id', match_id);

          await supabase.rpc('update_pvp_elo', {
            p_winner_wallet: playerWallet,
            p_loser_wallet: 'SKIP_BOT',
            p_elo_change: eloChange
          });

          await supabase.rpc('add_ell_balance', {
            p_wallet_address: playerWallet,
            p_amount: reward
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
          dice_roll_defender: null,
          damage_dealt: botResult.damage,
          is_blocked: false,
          is_critical: botResult.isCritical,
          result_state: botBattleState
        });
      }
    }

    return json({
      success: true,
      match_status: 'active',
      dice_roll: attackerRoll,
      damage_dealt: attackResult.damage,
      damage_percent: attackResult.damagePercent,
      is_miss: attackResult.isMiss,
      is_critical: attackResult.isCritical,
      is_counter_attack: attackResult.isCounterAttack,
      counter_attack_damage: counterAttackDamage,
      description: attackResult.description,
      next_turn: nextTurnWallet
    });

  } catch (error) {
    console.error('❌ [PvP Move] Error:', error);
    return json({ error: 'Internal server error' }, 500);
  }
});
