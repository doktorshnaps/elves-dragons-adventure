import { useEffect, useState } from 'react';
import { useWallet } from './useWallet';
import { useNFTCards } from './useNFTCards';
import { Card as CardType } from '@/types/cards';
import { useToast } from './use-toast';

export const useNFTCardIntegration = () => {
  const [nftCards, setNftCards] = useState<CardType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected, accountId } = useWallet();
  const { getUserNFTCards, syncNFTCards } = useNFTCards();
  const { toast } = useToast();

  // Автоматическая синхронизация при подключении кошелька
  useEffect(() => {
    if (isConnected && accountId) {
      syncNFTsFromWallet();
    }
  }, [isConnected, accountId]);

  const syncNFTsFromWallet = async () => {
    if (!accountId) return;

    setIsLoading(true);
    try {
      // Синхронизируем NFT с основного контракта и дополнительного
      await syncNFTCards(accountId, 'doubledog.hot.tg');
      
      // Получаем обновленные NFT карты
      const cards = await getUserNFTCards(accountId);
      
      // Конвертируем в формат игровых карт
      const gameCards: CardType[] = cards.map(nftCard => ({
        id: nftCard.id,
        name: nftCard.name,
        power: nftCard.power,
        defense: nftCard.defense,
        health: nftCard.health,
        currentHealth: nftCard.currentHealth,
        rarity: nftCard.rarity as any,
        faction: nftCard.faction as any,
        type: nftCard.type as 'character' | 'pet',
        description: nftCard.description || '',
        image: nftCard.image || '/placeholder.svg',
        magic: 0, // Добавляем обязательное поле magic
        isNFT: true,
        nftContractId: nftCard.nft_contract_id,
        nftTokenId: nftCard.nft_token_id
      }));

      setNftCards(gameCards);
      
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