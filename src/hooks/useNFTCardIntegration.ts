import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateCardStats } from '@/utils/cardUtils';

let globalHasSynced = false;
let syncInFlight = false;

export const useNFTCardIntegration = () => {
  const [nftCards, setNftCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const { accountId } = useWalletContext();
  const isConnected = !!accountId;
  const { getUserNFTCards, syncNFTCards } = useNFTCards();
  const { toast } = useToast();

  // Удаляем устаревшие NFT из локального хранилища и состояния игры
  const cleanupLocalNFTs = (currentNFTIds: string[]) => {
    try {
      const raw = localStorage.getItem('gameCards');
      if (!raw) return;
      const parsed = JSON.parse(raw) as CardType[];
      // Удаляем все NFT, которых нет среди текущих ID
      const cleaned = parsed.filter(c => !c.isNFT || currentNFTIds.includes(c.id));
      // Убираем дубликаты по id
      const unique = cleaned.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

      if (JSON.stringify(parsed) !== JSON.stringify(unique)) {
        localStorage.setItem('gameCards', JSON.stringify(unique));
        window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: unique } } as any));
        console.log('🧹 Removed stale NFT cards from local storage');
      }
    } catch (e) {
      console.warn('Cleanup local NFTs failed:', e);
    }
  };

  // Автоматическая синхронизация при подключении кошелька (только один раз)
  useEffect(() => {
    if (isConnected && accountId && !hasSynced && !globalHasSynced) {
      console.log('🔄 Auto-syncing NFTs for:', accountId);
      syncNFTsFromWallet();
    }
  }, [isConnected, accountId, hasSynced]);


  // Периодическая синхронизация - УВЕЛИЧЕНО до 5 минут для снижения нагрузки
  useEffect(() => {
    if (!isConnected || !accountId) return;
    const interval = setInterval(() => {
      syncNFTsFromWallet();
    }, 300000); // каждые 5 минут (вместо 60 секунд)
    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  // Проверка потери NFT во время активного подземелья
  useEffect(() => {
    if (!isConnected || !accountId || nftCards.length === 0) return;

    const checkNFTLoss = () => {
      // Проверяем наличие активного подземелья
      const teamBattleState = localStorage.getItem('teamBattleState');
      const hasActiveBattle = localStorage.getItem('activeBattleInProgress') === 'true';
      
      if (!teamBattleState || !hasActiveBattle) return;

      try {
        const state = JSON.parse(teamBattleState);
        const selectedTeam = state?.selectedTeam || [];
        
        if (selectedTeam.length === 0) return;

        // Собираем ID всех NFT карт в команде
        const nftIdsInTeam = new Set<string>();
        selectedTeam.forEach((pair: any) => {
          if (pair?.hero?.isNFT) nftIdsInTeam.add(pair.hero.id);
          if (pair?.dragon?.isNFT) nftIdsInTeam.add(pair.dragon.id);
        });

        if (nftIdsInTeam.size === 0) return;

        // Проверяем, есть ли все NFT карты в текущем списке
        const currentNftIds = new Set(nftCards.map(c => c.id));
        const missingNfts = Array.from(nftIdsInTeam).filter(id => !currentNftIds.has(id));

        if (missingNfts.length > 0) {
          console.warn('⚠️ NFT карты были переданы во время активного подземелья:', missingNfts);
          
          // Очищаем активное подземелье
          localStorage.removeItem('teamBattleState');
          localStorage.removeItem('activeBattleInProgress');
          window.dispatchEvent(new CustomEvent('battleReset'));
          
          // Показываем модальное окно
          window.dispatchEvent(new CustomEvent('nftTransferredDuringBattle', {
            detail: { missingNftIds: missingNfts }
          }));
        }
      } catch (error) {
        console.error('Error checking NFT loss:', error);
      }
    };

    // Проверяем при каждом изменении NFT карт (но не чаще чем раз в минуту)
    const timeoutId = setTimeout(checkNFTLoss, 1000);
    return () => clearTimeout(timeoutId);
  }, [nftCards, isConnected, accountId]);

  const syncNFTsFromWallet = async () => {
    if (!accountId) {
      console.log('⚠️ Skipping sync - no accountId');
      return;
    }
    if (syncInFlight) {
      console.log('⏳ Skipping sync - another sync is in flight');
      return;
    }
    syncInFlight = true;
    if (isLoading) {
      console.log('⏳ Instance already loading, but proceeding with global gate');
    }
    setIsLoading(true);
    try {
      // Синхронизируем NFT с основного контракта (doubledog.hot.tg)
      let synced: any[] = [];
      let fetched: any[] = [];
      let mintbaseCards: any[] = [];
      
      try {
        synced = await syncNFTCards(accountId, 'doubledog.hot.tg');
      } catch (syncError) {
        console.log('NFT sync failed, using fallback:', syncError);
      }
      
      try {
        // Получаем обновленные NFT карты из БД (fallback)
        fetched = await getUserNFTCards(accountId);
      } catch (fetchError) {
        console.log('NFT fetch failed:', fetchError);
      }

      // Синхронизируем NFT из Mintbase контрактов
      try {
        console.log('🔄 Syncing Mintbase NFTs...');
        
        // Sync from default Mintbase contract
        const { data: mintbaseData, error: mintbaseError } = await supabase.functions.invoke(
          'sync-mintbase-nfts',
          {
            body: { wallet_address: accountId }
          }
        );

        if (mintbaseError) {
          console.error('Mintbase sync error:', mintbaseError);
        } else if (mintbaseData?.cards) {
          mintbaseCards = mintbaseData.cards;
          console.log(`✅ Synced ${mintbaseCards.length} Mintbase NFTs from default contract`);
        }

        // Sync from elleonortesr.mintbase1.near
        const { data: elleonortesr, error: elleonortesrError } = await supabase.functions.invoke(
          'sync-mintbase-nfts',
          {
            body: { 
              wallet_address: accountId,
              contract_id: 'elleonortesr.mintbase1.near'
            }
          }
        );

        if (elleonortesrError) {
          console.error('Elleonortesr Mintbase sync error:', elleonortesrError);
        } else if (elleonortesr?.cards) {
          mintbaseCards = [...mintbaseCards, ...elleonortesr.cards];
          console.log(`✅ Synced ${elleonortesr.cards.length} NFTs from elleonortesr.mintbase1.near`);
        }
      } catch (mintbaseError) {
        console.log('Mintbase NFT sync failed:', mintbaseError);
      }
      
      // Объединяем все источники NFT
      const allNFTs = [...(synced || []), ...(fetched || []), ...mintbaseCards];
      
      // Убираем дубликаты по ID и конвертируем в формат игровых карт
      const uniqueNFTs = allNFTs.filter((nft, index, arr) => 
        arr.findIndex(n => n.id === nft.id) === index
      );
      
      const gameCards: CardType[] = uniqueNFTs.map(nftCard => {
        // Prefer explicit fields; fallback to parsing composite id like "contract_token"
        let nftContractId = (nftCard as any).nft_contract_id || (nftCard as any).nft_contract || (nftCard as any).contract_id;
        let nftTokenId = (nftCard as any).nft_token_id || (nftCard as any).token_id as string | undefined;

        if ((!nftContractId || !nftTokenId) && typeof (nftCard as any).id === 'string') {
          const composite = String((nftCard as any).id);
          // If id looks like `${contract}_${token}` and token is numeric, split by last underscore
          const lastUnderscore = composite.lastIndexOf('_');
          const tail = lastUnderscore > -1 ? composite.slice(lastUnderscore + 1) : '';
          if (lastUnderscore > 0 && /^\d+$/.test(tail)) {
            nftContractId = composite.slice(0, lastUnderscore);
            nftTokenId = tail;
          }
        }
        
        // Правильный маппинг типов NFT карт
        const rawType = (nftCard as any).type;
        let cardType: 'character' | 'pet' = 'character';
        
        // Проверяем все возможные варианты типов для драконов и героев
        if (rawType === 'dragon' || rawType === 'pet') {
          cardType = 'pet';
        } else if (rawType === 'hero' || rawType === 'character') {
          cardType = 'character';
        }
        
        return {
          id: (nftCard as any).id,
          name: (nftCard as any).name,
          power: (nftCard as any).power,
          defense: (nftCard as any).defense,
          health: (nftCard as any).health,
          currentHealth: (nftCard as any).currentHealth || (nftCard as any).health,
          rarity: (typeof (nftCard as any).rarity === 'number' ? (nftCard as any).rarity : 1) as any,
          faction: (nftCard as any).faction as any,
          type: cardType,
          description: (nftCard as any).description || '',
          image: (nftCard as any).image || '/placeholder.svg',
          magic: (nftCard as any).magic || 0,
          isNFT: true,
          nftContractId,
          nftTokenId
        };
      });

      console.log('✅ NFT sync completed, total cards:', gameCards.length);
      
      // 🆕 Синхронизация NFT карточек с card_instances
      if (gameCards.length > 0) {
        console.log('🔄 Syncing NFT cards to card_instances...');
        
        // Создаем/обновляем записи для каждой NFT карточки
        for (const card of gameCards) {
          if (!card.nftContractId || !card.nftTokenId) {
            console.warn('Missing NFT identifiers for card:', card.id, card);
            continue;
          }

          const nftContractId = String(card.nftContractId).trim();
          const nftTokenId = String(card.nftTokenId).trim();
          const cardType = card.type === 'pet' ? 'dragon' : 'hero';
          
          // Пересчитываем характеристики с актуальными настройками из БД
          const recalculatedStats = calculateCardStats(
            card.name, 
            Number(card.rarity) as any,
            card.type === 'pet' ? 'pet' : 'character'
          );
          const maxHealth = recalculatedStats.health;

          if (!nftContractId || !nftTokenId || !Number.isFinite(maxHealth)) {
            console.warn('Skipping upsert due to invalid params', { nftContractId, nftTokenId, maxHealth, cardId: card.id });
            continue;
          }

          // Обновляем card_data с пересчитанными характеристиками
          const updatedCardData = {
            ...card,
            health: maxHealth,
            power: recalculatedStats.power,
            defense: recalculatedStats.defense,
            magic: recalculatedStats.magic
          };

          try {
            console.log('⬆️ Upserting NFT card instance', { accountId, nftContractId, nftTokenId, cardTemplateId: card.id, cardType, maxHealth, recalculatedStats });
            const { data, error } = await supabase.rpc('upsert_nft_card_instance', {
              p_wallet_address: accountId,
              p_nft_contract_id: nftContractId,
              p_nft_token_id: nftTokenId,
              p_card_template_id: String(card.id),
              p_card_type: cardType,
              p_max_health: maxHealth,
              p_card_data: updatedCardData as any
            });
            
            if (error) {
              console.error('Error upserting NFT card instance:', { cardId: card.id, nftContractId, nftTokenId, error });
            } else {
              console.log('✅ NFT card instance synced:', card.id, data);
            }
          } catch (err) {
            console.error('Failed to upsert NFT card instance:', { cardId: card.id, nftContractId, nftTokenId, err });
          }
        }
        
        // Очистка переданных NFT
        const currentTokens = gameCards
          .filter(c => c.nftContractId && c.nftTokenId)
          .map(c => ({
            contract_id: String(c.nftContractId),
            token_id: String(c.nftTokenId)
          }));
        
        try {
          const { data: cleanupCount, error: cleanupError } = await supabase.rpc(
            'cleanup_transferred_nft_cards',
            {
              p_wallet_address: accountId,
              p_current_nft_tokens: currentTokens as any
            }
          );
          
          if (cleanupError) {
            console.error('Error cleaning up transferred NFTs:', cleanupError);
          } else if (cleanupCount && cleanupCount > 0) {
            console.log(`🧹 Cleaned up ${cleanupCount} transferred NFT cards`);
          }
        } catch (cleanupErr) {
          console.error('Failed to cleanup transferred NFTs:', cleanupErr);
        }
      }
      
      setNftCards(gameCards);
      // Синхронизируем локальное хранилище: удаляем несуществующие NFT
      cleanupLocalNFTs(gameCards.map(c => c.id));
      setHasSynced(true);
      
      // Убираем успешные уведомления - синхронизация в фоне
      console.log(`✅ NFT sync completed silently, cards: ${gameCards.length}`);
    } catch (error) {
      console.error('Error syncing NFT cards:', error);
      // Убираем toast-ошибки - синхронизация происходит в фоне
    } finally {
      setIsLoading(false);
      syncInFlight = false;
      if (!globalHasSynced) globalHasSynced = true;
    }
  };

  return {
    nftCards,
    isLoading,
    syncNFTsFromWallet,
    hasNFTCards: nftCards.length > 0
  };
};