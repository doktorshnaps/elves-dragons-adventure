import { useEffect, useState } from 'react';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';

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
    if (isConnected && accountId && !hasSynced) {
      console.log('🔄 Auto-syncing NFTs for:', accountId);
      syncNFTsFromWallet();
    }
  }, [isConnected, accountId, hasSynced]);

  // Периодическая синхронизация, чтобы удалять пропавшие из кошелька NFT
  useEffect(() => {
    if (!isConnected || !accountId) return;
    const interval = setInterval(() => {
      syncNFTsFromWallet();
    }, 60000); // каждые 60 секунд
    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  const syncNFTsFromWallet = async () => {
    if (!accountId || isLoading) {
      console.log('⚠️ Skipping sync - no accountId or already loading');
      return;
    }

    console.log('🔄 Starting NFT sync for:', accountId);
    setIsLoading(true);
    try {
      // Синхронизируем NFT с основного контракта и дополнительного
      let synced: any[] = [];
      let fetched: any[] = [];
      
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
      
      const source = (synced && synced.length > 0) ? synced : fetched;
      
      // Убираем дубликаты по ID и конвертируем в формат игровых карт
      const uniqueNFTs = source.filter((nft, index, arr) => 
        arr.findIndex(n => n.id === nft.id) === index
      );
      
      const gameCards: CardType[] = uniqueNFTs.map(nftCard => ({
        id: nftCard.id,
        name: nftCard.name,
        power: nftCard.power,
        defense: nftCard.defense,
        health: nftCard.health,
        currentHealth: nftCard.currentHealth,
        rarity: (typeof (nftCard as any).rarity === 'number' ? (nftCard as any).rarity : 1) as any,
        faction: nftCard.faction as any,
        type: (nftCard.type === 'character' ? 'character' : 'pet'),
        description: nftCard.description || '',
        image: nftCard.image || '/placeholder.svg',
        magic: 0, // обязательное поле
        isNFT: true,
        nftContractId: (nftCard as any).nft_contract_id,
        nftTokenId: (nftCard as any).nft_token_id
      }));

      console.log('✅ NFT sync completed, cards:', gameCards.length);
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
    }
  };

  return {
    nftCards,
    isLoading,
    syncNFTsFromWallet,
    hasNFTCards: nftCards.length > 0
  };
};