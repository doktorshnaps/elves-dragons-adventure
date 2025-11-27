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
  card_kills: Array<{
    card_template_id: string;
    kills: number;
  }>;
  card_health_updates: Array<{
    card_template_id: string;
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
    card_kills: battleReward.card_kills.length,
    card_updates: battleReward.card_health_updates.length
  });

  // Step 1: Request challenge/nonce from server
  console.log('🔐 [claimBattleRewards] Requesting claim challenge...');
  
  try {
    const challengeResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-claim-challenge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          wallet_address: battleReward.wallet_address,
          session_id: battleReward.claim_key
        }),
      }
    );

    if (!challengeResponse.ok) {
      throw new Error(`Failed to get challenge: HTTP ${challengeResponse.status}`);
    }

    const challengeData = await challengeResponse.json();
    const nonce = challengeData.challenge.nonce;

    console.log('✅ [claimBattleRewards] Challenge received:', {
      nonce: nonce.substring(0, 16) + '...',
      expires_at: challengeData.challenge.expires_at
    });

    // Step 2: Claim rewards with nonce
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-battle-rewards`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              ...battleReward,
              nonce: nonce
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result = await response.json();

        console.log('✅ [claimBattleRewards] Rewards claimed successfully:', result);

        return {
          success: true,
          message: result.message || 'Награды успешно начислены',
          data: result.results
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
