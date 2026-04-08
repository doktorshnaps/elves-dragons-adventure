import { toast } from '@/hooks/use-toast';

interface BattleReward {
  wallet_address: string;
  claim_key: string;
  dungeon_type: string;
  level: number;
  ell_reward: number;
  experience_reward: number;
  items: Array<{
    template_id: number;
    item_id: string;
    name: string;
    type: string;
    quantity?: number;
  }>;
  killed_monsters: Array<{
    monster_name: string;
    level: number;
  }>;
  card_kills: Array<{
    card_template_id: string;
    kills: number;
  }>;
  card_health_updates: Array<{
    card_instance_id: string;
    current_health: number;
    current_defense: number;
  }>;
}

interface ClaimResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * ФАЗА 2: Утилита для атомарного начисления боевых наград
 * 
 * Отправляет все награды за бой в одном запросе к Edge Function,
 * который атомарно применяет их через RPC apply_battle_rewards.
 * 
 * Идемпотентность обеспечивается через claim_key и таблицу reward_claims.
 * 
 * ENHANCED SECURITY:
 * - Запрашивает nonce перед claim (challenge-response pattern)
 * - Отправляет nonce вместе с claim запросом для валидации
 * - Edge Function проверяет: nonce validity, rate limiting, session expiry
 */
export const claimBattleRewards = async (
  battleReward: BattleReward
): Promise<ClaimResult> => {
  const maxRetries = 3;
  const retryDelays = [1000, 2000, 3000]; // Экспоненциальный backoff

  console.log('🎁 [claimBattleRewards] Starting reward claim:', {
    wallet: battleReward.wallet_address,
    claim_key: battleReward.claim_key,
    ell: battleReward.ell_reward,
    exp: battleReward.experience_reward,
    items: battleReward.items.length,
    killed_monsters: battleReward.killed_monsters.length,
    card_kills: battleReward.card_kills.length,
    card_updates: battleReward.card_health_updates.length
  });

  // Import Supabase client at the top
  const { supabase } = await import('@/integrations/supabase/client');

  // Step 1: Request challenge/nonce from server
  console.log('🔐 [claimBattleRewards] Requesting claim challenge...');
  
  try {
    // Use Supabase client to invoke edge function
    const { data: challengeData, error: challengeError } = await supabase.functions.invoke('get-claim-challenge', {
      body: {
        wallet_address: battleReward.wallet_address,
        session_id: battleReward.claim_key
      }
    });

    console.log('🔍 [claimBattleRewards] Challenge response:', { challengeData, challengeError });

    if (challengeError) {
      console.error('❌ [claimBattleRewards] Challenge request failed:', challengeError);
      throw new Error(`Failed to get challenge: ${challengeError.message}`);
    }

    if (!challengeData?.challenge?.nonce) {
      console.error('❌ [claimBattleRewards] Invalid challenge response:', challengeData);
      throw new Error('Invalid challenge response: missing nonce');
    }

    const nonce = challengeData.challenge.nonce;

    console.log('✅ [claimBattleRewards] Challenge received:', {
      nonce: nonce.substring(0, 16) + '...',
      expires_at: challengeData.challenge.expires_at
    });

    // Step 2: Claim rewards with nonce
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [claimBattleRewards] Attempt ${attempt} to claim with nonce`);
        
        // Use Supabase client to invoke edge function
        const { data: result, error: claimError } = await supabase.functions.invoke('claim-battle-rewards', {
          body: {
            ...battleReward,
            nonce: nonce
          }
        });

        console.log('🔍 [claimBattleRewards] Claim response:', { result, claimError });

        if (claimError) {
          console.error(`❌ [claimBattleRewards] Attempt ${attempt} failed:`, claimError);
          // Extract structured error from response if available
          const errorMsg = claimError.message || 'Failed to claim rewards';
          throw new Error(errorMsg);
        }

        if (!result) {
          throw new Error('Empty response from claim endpoint');
        }

        // Handle structured error responses (ok: false)
        if (result.ok === false) {
          const errorCode = result.code || 'UNKNOWN';
          console.error(`❌ [claimBattleRewards] Server error [${errorCode}]:`, result.error);
          throw new Error(result.error || 'Server error');
        }

        console.log('✅ [claimBattleRewards] Rewards claimed successfully:', result);
        console.log('🎁 [claimBattleRewards] Возвращаем награды из result.rewards:', result.rewards);

        return {
          success: true,
          message: result.message || 'Награды успешно начислены',
          data: result.rewards // ✅ ИСПРАВЛЕНИЕ: result.rewards содержит {ell_reward, experience_reward, items}
        };

      } catch (error) {
        console.error(`❌ [claimBattleRewards] Attempt ${attempt} failed:`, error);

        if (attempt < maxRetries) {
          const delay = retryDelays[attempt - 1];
          console.log(`⏳ [claimBattleRewards] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('❌ [claimBattleRewards] All retry attempts exhausted');
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Не удалось начислить награды'
          };
        }
      }
    }

    return {
      success: false,
      message: 'Не удалось начислить награды после нескольких попыток'
    };

  } catch (challengeError) {
    console.error('❌ [claimBattleRewards] Failed to get challenge:', challengeError);
    return {
      success: false,
      message: challengeError instanceof Error ? challengeError.message : 'Не удалось получить challenge'
    };
  }
};

/**
 * Генерирует уникальный claim_key для боя
 */
export const generateClaimKey = (
  dungeonType: string,
  wallet: string,
  level: number
): string => {
  const timestamp = Date.now();
  return `battle_${dungeonType}_${wallet}_${level}_${timestamp}`;
};
