import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCardInstances } from './useCardInstances';

/**
 * Хук для работы со статистикой NFT карточек
 * Работает через card_instances с привязкой по nft_contract_id + nft_token_id
 */
export const useNFTCardStats = () => {
  const { cardInstances, loadCardInstances } = useCardInstances();

  /**
   * Получить статистику NFT карточки по уникальным идентификаторам
   */
  const getNFTStats = useCallback(async (nftContractId: string, nftTokenId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_nft_card_stats', {
        p_nft_contract_id: nftContractId,
        p_nft_token_id: nftTokenId
      });

      if (error) {
        console.error('Error getting NFT stats:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Failed to get NFT stats:', err);
      return null;
    }
  }, []);

  /**
   * Получить инстанс NFT карточки из локального состояния
   */
  const getNFTInstance = useCallback((nftContractId: string, nftTokenId: string) => {
    return cardInstances.find(
      ci => ci.nft_contract_id === nftContractId && ci.nft_token_id === nftTokenId
    );
  }, [cardInstances]);

  /**
   * Получить текущее здоровье NFT карточки
   */
  const getNFTHealth = useCallback((nftContractId: string, nftTokenId: string) => {
    const instance = getNFTInstance(nftContractId, nftTokenId);
    return {
      current: instance?.current_health ?? 0,
      max: instance?.max_health ?? 0
    };
  }, [getNFTInstance]);

  /**
   * Получить количество убитых монстров для NFT карточки
   */
  const getNFTMonsterKills = useCallback((nftContractId: string, nftTokenId: string) => {
    const instance = getNFTInstance(nftContractId, nftTokenId);
    return instance?.monster_kills ?? 0;
  }, [getNFTInstance]);

  /**
   * Проверить, находится ли NFT карточка в медицинском отсеке
   */
  const isNFTInMedicalBay = useCallback((nftContractId: string, nftTokenId: string) => {
    const instance = getNFTInstance(nftContractId, nftTokenId);
    return instance?.is_in_medical_bay ?? false;
  }, [getNFTInstance]);

  return {
    getNFTStats,
    getNFTInstance,
    getNFTHealth,
    getNFTMonsterKills,
    isNFTInMedicalBay,
    refreshStats: loadCardInstances
  };
};
