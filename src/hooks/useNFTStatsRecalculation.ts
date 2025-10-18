import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateCardStats } from '@/utils/cardUtils';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from './use-toast';

/**
 * Хук для автоматического пересчета характеристик NFT карточек
 * при изменении настроек игры (базовых характеристик или множителей)
 */
export const useNFTStatsRecalculation = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();

  useEffect(() => {
    if (!accountId) return;

    // Слушаем изменения в таблицах настроек
    const heroBaseStatsChannel = supabase
      .channel('hero_base_stats_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'hero_base_stats' },
        async () => {
          console.log('🔄 Hero base stats changed, recalculating NFT stats...');
          await recalculateNFTStats(accountId);
        }
      )
      .subscribe();

    const dragonBaseStatsChannel = supabase
      .channel('dragon_base_stats_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dragon_base_stats' },
        async () => {
          console.log('🔄 Dragon base stats changed, recalculating NFT stats...');
          await recalculateNFTStats(accountId);
        }
      )
      .subscribe();

    const rarityMultipliersChannel = supabase
      .channel('rarity_multipliers_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rarity_multipliers' },
        async () => {
          console.log('🔄 Rarity multipliers changed, recalculating NFT stats...');
          await recalculateNFTStats(accountId);
        }
      )
      .subscribe();

    const classMultipliersChannel = supabase
      .channel('class_multipliers_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'class_multipliers' },
        async () => {
          console.log('🔄 Class multipliers changed, recalculating NFT stats...');
          await recalculateNFTStats(accountId);
        }
      )
      .subscribe();

    return () => {
      heroBaseStatsChannel.unsubscribe();
      dragonBaseStatsChannel.unsubscribe();
      rarityMultipliersChannel.unsubscribe();
      classMultipliersChannel.unsubscribe();
    };
  }, [accountId]);

  const recalculateNFTStats = async (walletAddress: string) => {
    try {
      // Получаем все NFT карточки пользователя из card_instances
      const { data: nftInstances, error } = await supabase
        .from('card_instances')
        .select('*')
        .eq('wallet_address', walletAddress)
        .not('nft_contract_id', 'is', null)
        .not('nft_token_id', 'is', null);

      if (error) {
        console.error('Error fetching NFT instances:', error);
        return;
      }

      if (!nftInstances || nftInstances.length === 0) {
        console.log('No NFT cards to recalculate');
        return;
      }

      console.log(`🔄 Recalculating stats for ${nftInstances.length} NFT cards...`);

      // Пересчитываем характеристики для каждой NFT карточки
      for (const instance of nftInstances) {
        const cardData = instance.card_data as any;
        const cardName = cardData.name || '';
        const rarity = Number(cardData.rarity) || 1;
        const cardType = instance.card_type === 'dragon' ? 'pet' : 'character';

        // Пересчитываем характеристики
        const recalculatedStats = calculateCardStats(cardName, rarity as any, cardType);

        // Обновляем card_data с новыми характеристиками
        const updatedCardData = {
          ...cardData,
          health: recalculatedStats.health,
          power: recalculatedStats.power,
          defense: recalculatedStats.defense,
          magic: recalculatedStats.magic
        };

        // Обновляем запись в БД
        const { error: updateError } = await supabase.rpc('upsert_nft_card_instance', {
          p_wallet_address: walletAddress,
          p_nft_contract_id: instance.nft_contract_id!,
          p_nft_token_id: instance.nft_token_id!,
          p_card_template_id: instance.card_template_id,
          p_card_type: instance.card_type,
          p_max_health: recalculatedStats.health,
          p_card_data: updatedCardData
        });

        if (updateError) {
          console.error('Error updating NFT instance:', updateError);
        } else {
          console.log(`✅ Recalculated stats for NFT: ${cardName} (${instance.nft_token_id})`);
        }
      }

      toast({
        title: "Характеристики обновлены",
        description: `Пересчитано ${nftInstances.length} NFT карточек`,
      });
    } catch (error) {
      console.error('Error recalculating NFT stats:', error);
    }
  };

  return { recalculateNFTStats };
};
