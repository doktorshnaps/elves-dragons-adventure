import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateCardStats } from '@/utils/cardUtils';

let globalHasSynced = false;
let syncInFlight = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN = 10000; // 10 секунд между синхронизациями

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
      // 1. Очистка gameCards
      const raw = localStorage.getItem('gameCards');
      if (raw) {
        const parsed = JSON.parse(raw) as CardType[];
        // Удаляем все NFT, которых нет среди текущих ID
        const cleaned = parsed.filter(c => !c.isNFT || currentNFTIds.includes(c.id));
        // Убираем дубликаты по id
        const unique = cleaned.filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i);

        if (JSON.stringify(parsed) !== JSON.stringify(unique)) {
          localStorage.setItem('gameCards', JSON.stringify(unique));
          window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: unique } } as any));
          console.log('🧹 Removed stale NFT cards from gameCards');
        }
      }
      
      // 2. КРИТИЧНО: Очистка selectedTeam от несуществующих NFT
      const teamRaw = localStorage.getItem('selectedTeam');
      if (teamRaw) {
        try {
          const selectedTeam = JSON.parse(teamRaw) as any[];
          const cleanedTeam = selectedTeam.map(pair => {
            const cleanedPair = { ...pair };
            
            // Удаляем героя, если это NFT и его нет в списке
            if (pair.hero?.isNFT && !currentNFTIds.includes(pair.hero.id)) {
              console.log(`🧹 Removing transferred NFT hero from team: ${pair.hero.name}`);
              cleanedPair.hero = undefined;
            }
            
            // Удаляем дракона, если это NFT и его нет в списке
            if (pair.dragon?.isNFT && !currentNFTIds.includes(pair.dragon.id)) {
              console.log(`🧹 Removing transferred NFT dragon from team: ${pair.dragon.name}`);
              cleanedPair.dragon = undefined;
            }
            
            return cleanedPair;
          }).filter(pair => pair.hero || pair.dragon); // Удаляем пустые пары
          
          if (JSON.stringify(selectedTeam) !== JSON.stringify(cleanedTeam)) {
            localStorage.setItem('selectedTeam', JSON.stringify(cleanedTeam));
            window.dispatchEvent(new CustomEvent('teamUpdate', { detail: { team: cleanedTeam } } as any));
            console.log('🧹 Removed stale NFT cards from selectedTeam');
          }
        } catch (teamErr) {
          console.warn('Failed to cleanup selectedTeam:', teamErr);
        }
      }
    } catch (e) {
      console.warn('Cleanup local NFTs failed:', e);
    }
  };

  // Принудительная очистка NFT при подключении кошелька
  const forceCleanupOnConnect = async () => {
    if (!accountId) return;
    
    try {
      console.log('🔄 Force cleanup on wallet connect');
      
      // Получаем текущие NFT из БД
      const { data: dbCards } = await supabase.rpc('get_card_instances_by_wallet', {
        p_wallet_address: accountId
      });
      
      const currentNFTIds = (dbCards || [])
        .filter((c: any) => c.nft_contract_id && c.nft_token_id)
        .map((c: any) => c.card_template_id);
      
      // Очищаем локальное хранилище
      cleanupLocalNFTs(currentNFTIds);
    } catch (err) {
      console.warn('Force cleanup failed:', err);
    }
  };

  // Автоматическая синхронизация при подключении кошелька (только один раз)
  useEffect(() => {
    if (isConnected && accountId && !hasSynced && !globalHasSynced) {
      console.log('🔄 Auto-syncing NFTs for:', accountId);
      // Сначала принудительная очистка, затем синхронизация
      forceCleanupOnConnect().then(() => {
        syncNFTsFromWallet();
      });
    }
  }, [isConnected, accountId, hasSynced]);


  // Периодическая синхронизация - УВЕЛИЧЕНО до 10 минут для снижения нагрузки
  useEffect(() => {
    if (!isConnected || !accountId) return;
    const interval = setInterval(() => {
      syncNFTsFromWallet();
    }, 600000); // каждые 10 минут (было 5 минут)
    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  // Проверка потери NFT во время активного подземелья - с debounce
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

    // Проверяем только через 3 секунды после изменения (debounce)
    const timeoutId = setTimeout(checkNFTLoss, 3000);
    return () => clearTimeout(timeoutId);
  }, [nftCards, isConnected, accountId]);

  const syncNFTsFromWallet = async () => {
    if (!accountId) {
      console.log('⚠️ Skipping sync - no accountId');
      return;
    }
    
    // Проверяем cooldown - не синхронизируем чаще чем раз в 10 секунд
    const now = Date.now();
    if (now - lastSyncTime < SYNC_COOLDOWN) {
      console.log(`⏳ Skipping sync - cooldown active (${Math.ceil((SYNC_COOLDOWN - (now - lastSyncTime)) / 1000)}s remaining)`);
      return;
    }
    
    if (syncInFlight) {
      console.log('⏳ Skipping sync - another sync is in flight');
      return;
    }
    
    syncInFlight = true;
    lastSyncTime = now;
    
    if (isLoading) {
      console.log('⏳ Instance already loading, but proceeding with global gate');
    }
    setIsLoading(true);
    try {
      // Синхронизируем NFT карты
      let synced: any[] = [];
      let fetched: any[] = [];
      let mintbaseCards: any[] = [];
      
      try {
        // Получаем NFT карты из БД
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
      
      // Объединяем все источники NFT и фильтруем заблокированные контракты
      const allNFTs = [...(synced || []), ...(fetched || []), ...mintbaseCards]
        .filter(nft => {
          const contractId = (nft as any).nft_contract_id || (nft as any).nft_contract || (nft as any).contract_id;
          return contractId !== 'doubledog.hot.tg';
        });
      console.log(`🔄 NFT Sources (after filter): synced=${synced?.length || 0}, fetched=${fetched?.length || 0}, mintbase=${mintbaseCards.length}, total=${allNFTs.length}`);
      
      // Убираем дубликаты по ID и конвертируем в формат игровых карт
      const uniqueNFTs = allNFTs.filter((nft, index, arr) => 
        arr.findIndex(n => n.id === nft.id) === index
      );
      console.log(`✅ Total unique NFTs before mapping: ${uniqueNFTs.length}`);
      
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
        
        // СТРОГИЙ маппинг типов NFT карт: только карты со словом "дракон/dragon" - драконы, остальные - герои
        const cardName = String((nftCard as any).name || '').toLowerCase();
        let cardType: 'character' | 'pet' = 'character';
        
        console.log(`🔄 NFT Mapping: ${(nftCard as any).name}`);
        
        // Строгая проверка: только если в названии есть "dragon" или "дракон", это дракон
        if (cardName.includes('dragon') || cardName.includes('дракон')) {
          cardType = 'pet';
          console.log(`  ✅ Mapped to 'pet' (dragon) - found dragon keyword`);
        } else {
          cardType = 'character';
          console.log(`  ✅ Mapped to 'character' (hero) - no dragon keyword`);
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
      console.log(`📊 NFT breakdown: ${gameCards.filter(c => c.type === 'character').length} heroes, ${gameCards.filter(c => c.type === 'pet').length} dragons`);
      
      if (gameCards.length > 0) {
        console.log('🎴 Sample NFT cards:');
        gameCards.slice(0, 3).forEach(card => {
          console.log(`  - ${card.name}: type=${card.type}, faction=${card.faction}, isNFT=${card.isNFT}`);
        });
      }
      
      // 🆕 Синхронизация NFT карточек с card_instances (BATCH)
      if (gameCards.length > 0) {
        console.log(`🔄 Syncing ${gameCards.length} NFT cards to card_instances (batched)...`);
        
        // Подготавливаем все данные для батч-вставки
        const validCards = gameCards.filter(card => {
          if (!card.nftContractId || !card.nftTokenId) {
            console.warn('Missing NFT identifiers for card:', card.id);
            return false;
          }
          const recalculatedStats = calculateCardStats(
            card.name, 
            Number(card.rarity) as any,
            card.type === 'pet' ? 'pet' : 'character'
          );
          return Number.isFinite(recalculatedStats.health);
        });

        console.log(`✅ Valid cards for sync: ${validCards.length}/${gameCards.length}`);
        
        // Группируем по батчам (5 карт за раз для снижения нагрузки)
        const BATCH_SIZE = 5;
        for (let i = 0; i < validCards.length; i += BATCH_SIZE) {
          const batch = validCards.slice(i, i + BATCH_SIZE);
          
          // Параллельные вызовы внутри батча
          await Promise.allSettled(
            batch.map(async card => {
              const nftContractId = String(card.nftContractId).trim();
              const nftTokenId = String(card.nftTokenId).trim();
              const cardType = card.type === 'pet' ? 'dragon' : 'hero';
              
              const recalculatedStats = calculateCardStats(
                card.name, 
                Number(card.rarity) as any,
                card.type === 'pet' ? 'pet' : 'character'
              );
              const maxHealth = recalculatedStats.health;

              const updatedCardData = {
                ...card,
                health: maxHealth,
                power: recalculatedStats.power,
                defense: recalculatedStats.defense,
                magic: recalculatedStats.magic
              };

              try {
                const { error } = await supabase.rpc('upsert_nft_card_instance', {
                  p_wallet_address: accountId,
                  p_nft_contract_id: nftContractId,
                  p_nft_token_id: nftTokenId,
                  p_card_template_id: String(card.id),
                  p_card_type: cardType,
                  p_max_health: maxHealth,
                  p_card_data: updatedCardData as any
                });
                
                if (error) {
                  console.error('Error upserting NFT card instance:', { cardId: card.id, error });
                }
              } catch (err) {
                console.error('Failed to upsert NFT card instance:', { cardId: card.id, err });
              }
            })
          );
          
          console.log(`✅ Synced batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validCards.length / BATCH_SIZE)}`);
          
          // Добавляем небольшую задержку между батчами для снижения нагрузки
          if (i + BATCH_SIZE < validCards.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
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
      
      // КРИТИЧНО: Сначала очищаем локальное хранилище
      cleanupLocalNFTs(gameCards.map(c => c.id));
      
      // Затем очищаем БД от переданных NFT
      const currentTokens = gameCards
        .filter(c => c.nftContractId && c.nftTokenId)
        .map(c => ({
          contract_id: String(c.nftContractId),
          token_id: String(c.nftTokenId)
        }));
      
      // Вызываем cleanup ВСЕГДА, даже если нет новых карт
      try {
        console.log(`🔄 Running NFT cleanup for wallet ${accountId}, current tokens:`, currentTokens.length);
        const { data: cleanupCount, error: cleanupError } = await supabase.rpc(
          'cleanup_transferred_nft_cards',
          {
            p_wallet_address: accountId,
            p_current_nft_tokens: currentTokens as any
          }
        );
        
        if (cleanupError) {
          console.error('Error cleaning up transferred NFTs:', cleanupError);
        } else {
          console.log(`🧹 Cleanup completed: ${cleanupCount || 0} transferred NFT cards removed from DB`);
          
          // КРИТИЧНО: Если были удалены карты, обновляем состояние и оповещаем систему
          if (cleanupCount && cleanupCount > 0) {
            // Обновляем локальное состояние nftCards, удаляя переданные NFT
            const validTokenSet = new Set(currentTokens.map(t => `${t.contract_id}_${t.token_id}`));
            const updatedNftCards = gameCards.filter(c => {
              if (!c.nftContractId || !c.nftTokenId) return true;
              return validTokenSet.has(`${c.nftContractId}_${c.nftTokenId}`);
            });
            setNftCards(updatedNftCards);
            
            // Оповещаем систему об обновлении карт
            window.dispatchEvent(new CustomEvent('cardsUpdate', { 
              detail: { cards: updatedNftCards } 
            }));
            
            // Оповещаем об обновлении card_instances, чтобы UI обновился
            window.dispatchEvent(new CustomEvent('cardInstancesUpdate'));
          }
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup transferred NFTs:', cleanupErr);
      }
      
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