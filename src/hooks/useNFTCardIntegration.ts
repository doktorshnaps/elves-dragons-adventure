import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateCardStats } from '@/utils/cardUtils';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

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
          // Invalidate cache instead of window event
          queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
          console.log('🧹 Removed stale NFT cards from gameCards');
        }
      }
      
      // 2. КРИТИЧНО: Очистка selectedTeam от несуществующих NFT
      // ОТКЛЮЧЕНО: эта логика ошибочно удаляет обычные карточки из команды
      // При выходе из подземелья selectedTeam может быть пустым, и синхронизация затирает команду в БД
      console.log('⏸️ Team cleanup disabled to prevent data loss');
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

  // Автоматическая синхронизация при подключении кошелька (только один раз с задержкой 3 секунды)
  useEffect(() => {
    if (!isConnected || !accountId || hasSynced || globalHasSynced) return;
    
    console.log('⏰ Scheduling delayed NFT auto-sync in 3 seconds for:', accountId);
    
    // Задержка 3 секунды перед началом синхронизации
    const timeoutId = setTimeout(() => {
      console.time('⏱️ NFT Auto-sync');
      console.log('🔄 Auto-syncing NFTs for:', accountId);
      performance.mark('nft-sync-start');
      
      // Сначала принудительная очистка, затем синхронизация
      forceCleanupOnConnect().then(() => {
        performance.mark('nft-cleanup-end');
        performance.measure('NFT Cleanup', 'nft-sync-start', 'nft-cleanup-end');
        
        syncNFTsFromWallet().finally(() => {
          performance.mark('nft-sync-end');
          performance.measure('NFT Sync Total', 'nft-sync-start', 'nft-sync-end');
          console.timeEnd('⏱️ NFT Auto-sync');
          
          const measures = performance.getEntriesByType('measure');
          measures.forEach(measure => {
            console.log(`📊 ${measure.name}: ${Math.round(measure.duration)}ms`);
          });
        });
      });
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [isConnected, accountId, hasSynced]);


  // Периодическая синхронизация - ОТКЛЮЧЕНА для минимизации нагрузки
  // Игрок должен вручную синхронизировать NFT через кнопку в меню

  // Проверка потери NFT во время активного подземелья - ОТКЛЮЧЕНА для минимизации нагрузки

  const syncNFTsFromWallet = async () => {
    if (!accountId) {
      console.log('⚠️ Skipping sync - no accountId');
      return;
    }

    let whitelistedContracts: string[] = [];

    try {
      const { data: activeContracts, error: whitelistError } = await supabase
        .from('whitelist_contracts')
        .select('contract_id')
        .eq('is_active', true);

      if (whitelistError) {
        console.error('Failed to load whitelist contracts for NFT sync:', whitelistError);
      } else {
        whitelistedContracts = (activeContracts || []).map((item: any) => item.contract_id).filter(Boolean);
      }
    } catch (error) {
      console.error('Unexpected whitelist contracts load error:', error);
    }
    
    // Проверяем cooldown - не синхронизируем чаще чем раз в 10 секунд
    const now = Date.now();
    if (now - lastSyncTime < SYNC_COOLDOWN) {
      console.warn(`⏳ THROTTLED: Skipping sync - cooldown active (${Math.ceil((SYNC_COOLDOWN - (now - lastSyncTime)) / 1000)}s remaining)`);
      console.trace('Throttled call stack:');
      return;
    }
    
    if (syncInFlight) {
      console.warn('⏳ BLOCKED: Another sync is in flight');
      console.trace('Blocked call stack:');
      return;
    }
    
    console.time('⏱️ syncNFTsFromWallet');
    performance.mark('sync-nfts-start');
    syncInFlight = true;
    lastSyncTime = now;
    console.log(`🚀 Starting NFT sync at ${new Date().toISOString()}`);
    
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

      try {
        synced = await syncNFTCards(accountId, undefined, whitelistedContracts);
      } catch (syncError) {
        console.log('NFT sync failed:', syncError);
      }

      // Синхронизируем NFT из Mintbase контрактов
      try {
        console.log('🔄 Syncing Mintbase NFTs...');
        console.time('⏱️ Mintbase Default Contract');
        performance.mark('mintbase-default-start');
        
        // Sync from default Mintbase contract
        const { data: mintbaseData, error: mintbaseError } = await supabase.functions.invoke(
          'sync-mintbase-nfts',
          {
            body: { wallet_address: accountId }
          }
        );
        
        performance.mark('mintbase-default-end');
        performance.measure('Mintbase Default', 'mintbase-default-start', 'mintbase-default-end');
        console.timeEnd('⏱️ Mintbase Default Contract');

        if (mintbaseError) {
          console.error('Mintbase sync error:', mintbaseError);
        } else if (mintbaseData?.cards) {
          mintbaseCards = mintbaseData.cards;
          console.log(`✅ Synced ${mintbaseCards.length} Mintbase NFTs from default contract`);
        }

        // Sync from elleonortesr.mintbase1.near
        console.time('⏱️ Mintbase Elleonortesr Contract');
        performance.mark('mintbase-elleonortesr-start');
        
        const { data: elleonortesr, error: elleonortesrError } = await supabase.functions.invoke(
          'sync-mintbase-nfts',
          {
            body: { 
              wallet_address: accountId,
              contract_id: 'elleonortesr.mintbase1.near'
            }
          }
        );
        
        performance.mark('mintbase-elleonortesr-end');
        performance.measure('Mintbase Elleonortesr', 'mintbase-elleonortesr-start', 'mintbase-elleonortesr-end');
        console.timeEnd('⏱️ Mintbase Elleonortesr Contract');

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
      
      // КРИТИЧНО: Если NFT карт нет вообще, принудительно очищаем localStorage И game_data
      if (allNFTs.length === 0) {
        console.log('🧹 No NFTs found in DB - force clearing localStorage and game_data cache');
        cleanupLocalNFTs([]); // Передаем пустой массив, чтобы удалить все NFT из кеша
        setNftCards([]);
        
        // КРИТИЧНО: Также очищаем game_data.cards от NFT через edge function
        try {
          const { data: cleanupResult, error: cleanupError } = await supabase.functions.invoke('cleanup-nft-gamedata', {
            body: { wallet_address: accountId }
          });
          
          if (cleanupError) {
            console.error('Failed to cleanup game_data NFTs:', cleanupError);
          } else {
            console.log('✅ game_data cleanup result:', cleanupResult);
          }
        } catch (err) {
          console.error('Error calling cleanup-nft-gamedata:', err);
        }
        
        // Invalidate caches instead of window events
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
          queryClient.invalidateQueries({ queryKey: ['gameData'] })
        ]);
        
        setIsLoading(false);
        toast({
          title: "NFT синхронизированы",
          description: "Все NFT карточки обновлены",
        });
        return;
      }
      
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
          console.log(`🧹 Cleanup completed: ${cleanupCount || 0} records removed (card_instances + user_nft_cards + game_data)`);
          
          // КРИТИЧНО: Если были удалены карты, обновляем состояние и оповещаем систему
          if (cleanupCount && cleanupCount > 0) {
            // Обновляем локальное состояние nftCards, удаляя переданные NFT
            const validTokenSet = new Set(currentTokens.map(t => `${t.contract_id}_${t.token_id}`));
            const updatedNftCards = gameCards.filter(c => {
              if (!c.nftContractId || !c.nftTokenId) return true;
              return validTokenSet.has(`${c.nftContractId}_${c.nftTokenId}`);
            });
            setNftCards(updatedNftCards);
            
            // Invalidate caches instead of window events
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ['cardInstances'] }),
              queryClient.invalidateQueries({ queryKey: ['gameData'] })
            ]);
            
            console.log('✅ NFT cleanup completed, UI will reload data');
          }
        }
      } catch (cleanupErr) {
        console.error('Failed to cleanup transferred NFTs:', cleanupErr);
      }
      
      setHasSynced(true);
      await queryClient.invalidateQueries({ queryKey: ['goldenTicketCheck'] });
      
      // Убираем успешные уведомления - синхронизация в фоне
      console.log(`✅ NFT sync completed silently, cards: ${gameCards.length}`);
    } catch (error) {
      console.error('Error syncing NFT cards:', error);
      // Убираем toast-ошибки - синхронизация происходит в фоне
    } finally {
      setIsLoading(false);
      syncInFlight = false;
      if (!globalHasSynced) globalHasSynced = true;
      queryClient.invalidateQueries({ queryKey: ['goldenTicketCheck'] });
      
      performance.mark('sync-nfts-end');
      performance.measure('Total NFT Sync', 'sync-nfts-start', 'sync-nfts-end');
      console.timeEnd('⏱️ syncNFTsFromWallet');
      
      const measures = performance.getEntriesByType('measure').slice(-5);
      console.log('📊 NFT Sync Performance:');
      measures.forEach(measure => {
        console.log(`  ${measure.name}: ${Math.round(measure.duration)}ms`);
      });
      
      console.log(`✅ Sync completed at ${new Date().toISOString()}, flight flag released`);
    }
  };

  return {
    nftCards,
    isLoading,
    syncNFTsFromWallet,
    hasNFTCards: nftCards.length > 0
  };
};