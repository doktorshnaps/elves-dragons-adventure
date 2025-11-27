import { useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BattleStats } from './useBattleState';
import { claimBattleRewards as claimBattleRewardsUtil } from '@/utils/claimBattleRewards';

export const useBattleRewards = (accountId: string | null) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isClaimingRef = useRef(false);

  const claimBattleRewards = useCallback(async (
    claimKey: string,
    dungeonType: string,
    level: number,
    stats: BattleStats,
    cardHealthUpdates: Array<{
      card_instance_id: string; // ИСПРАВЛЕНО: было card_template_id
      current_health: number;
      current_defense: number;
    }>
  ) => {
    if (isClaimingRef.current) {
      console.warn('⚠️ Claim already in progress, skipping duplicate');
      return { success: false, error: 'Claim already in progress' };
    }

    if (!claimKey) {
      console.error('❌ No claim key provided');
      toast({
        title: "Ошибка",
        description: "Отсутствует ключ для получения наград",
        variant: "destructive"
      });
      return { success: false, error: 'No claim key' };
    }

    isClaimingRef.current = true;

    try {
      console.log('💎 [useBattleRewards] Claiming battle rewards', {
        claimKey,
        level,
        ellReward: stats.ellEarned,
        expReward: stats.experienceGained,
        items: stats.lootedItems.length,
        cardKills: stats.cardKills.length
      });

      console.log('📞 [useBattleRewards] Calling claimBattleRewardsUtil with data:', {
        wallet_address: accountId,
        claim_key: claimKey,
        items_count: stats.lootedItems.length
      });

      // 🔒 SECURITY: Use utility function with challenge/nonce flow
      const result = await claimBattleRewardsUtil({
        wallet_address: accountId!,
        claim_key: claimKey,
        dungeon_type: dungeonType,
        level,
        ell_reward: stats.ellEarned,
        experience_reward: stats.experienceGained,
        items: stats.lootedItems.map(item => ({
          template_id: item.template_id,
          item_id: item.item_id,
          name: item.name,
          type: item.type,
          quantity: item.quantity
        })),
        killed_monsters: stats.killedMonsters || [], // Pass killed monsters for server-side validation
        card_kills: stats.cardKills,
        card_health_updates: cardHealthUpdates
      });

      console.log('📬 [useBattleRewards] Received result from utility:', result);

      if (!result.success) {
        console.error('❌ [useBattleRewards] Claim failed:', result.message);
        toast({
          title: "Ошибка начисления наград",
          description: result.message || "Не удалось начислить награды за бой",
          variant: "destructive"
        });
        return { success: false, error: result.message };
      }

      console.log('✅ [useBattleRewards] Rewards claimed successfully:', result.data);
      const data = result.data;

      // Инвалидируем кеши для обновления UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['gameData', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['cardInstances', accountId] }),
        queryClient.invalidateQueries({ queryKey: ['itemInstances', accountId] })
      ]);

      // Очищаем claim_key после успешного клейма
      localStorage.removeItem('currentClaimKey');

      toast({
        title: "🎉 Награды получены!",
        description: `+${stats.ellEarned} ELL, +${stats.experienceGained} опыта, ${stats.lootedItems.length} предметов`
      });

      return { success: true, data };

    } catch (err) {
      console.error('❌ [useBattleRewards] Unexpected error:', err);
      toast({
        title: "Ошибка",
        description: "Произошла неожиданная ошибка при начислении наград",
        variant: "destructive"
      });
      return { success: false, error: String(err) };
    } finally {
      isClaimingRef.current = false;
    }
  }, [toast, queryClient]);

  return { claimBattleRewards };
};
