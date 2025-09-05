import { useEffect, useState } from 'react';
import { useWallet } from './useWallet';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';

export const useNFTCardIntegration = () => {
  const [nftCards, setNftCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const { isConnected, accountId } = useWallet();
  const { getUserNFTCards, syncNFTCards } = useNFTCards();
  const { toast } = useToast();

  // Автоматическая синхронизация при подключении кошелька (только один раз)
  useEffect(() => {
    if (isConnected && accountId && !hasSynced) {
      console.log('🔄 Auto-syncing NFTs for:', accountId);
      syncNFTsFromWallet();
    }
  }, [isConnected, accountId, hasSynced]);

  const syncNFTsFromWallet = async () => {
    if (!accountId || isLoading) {
      console.log('⚠️ Skipping sync - no accountId or already loading');
      return;
    }

    console.log('🔄 Starting NFT sync for:', accountId);
    setIsLoading(true);
    try {
      // Синхронизируем NFT с основного контракта и дополнительного
      const synced = await syncNFTCards(accountId, 'doubledog.hot.tg');
      
      // Получаем обновленные NFT карты из БД (fallback)
      const fetched = await getUserNFTCards(accountId);
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
      setHasSynced(true);
      
      if (gameCards.length > 0) {
        toast({
          title: "NFT карты синхронизированы",
          description: `Загружено ${gameCards.length} NFT карт из кошелька`
        });
      }
    } catch (error) {
      console.error('Error syncing NFT cards:', error);
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось загрузить NFT карты",
        variant: "destructive"
      });
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