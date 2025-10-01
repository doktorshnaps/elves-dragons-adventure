import { Card } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';
import { getCardPrice, upgradeCard } from '@/utils/cardUtils';
import { useGameData } from '@/hooks/useGameData';
import { 
  removeCard, 
  addCard, 
  batchRemoveCards,
  type NormalizedCards,
  denormalizeCards
} from '@/utils/cardNormalization';

/**
 * Optimized card operations using normalized data structures
 */
export const useCardOperations = () => {
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();

  /**
   * Sell card with optimized removal
   */
  const sellCard = async (
    cardId: string,
    normalized: NormalizedCards
  ) => {
    const card = normalized.byId.get(cardId);
    if (!card) return null;

    const price = getCardPrice(card.rarity);
    const newBalance = gameData.balance + price;
    
    // Remove from normalized structure
    const updatedNormalized = removeCard(normalized, cardId);
    const newCards = denormalizeCards(updatedNormalized);
    
    // Update database
    await updateGameData({
      cards: newCards,
      balance: newBalance
    });

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} ELL`,
    });

    return { updatedNormalized, newBalance };
  };

  /**
   * Upgrade card with optimized card manipulation
   */
  const performUpgrade = async (
    card1: Card,
    card2: Card,
    normalized: NormalizedCards
  ) => {
    const upgradedCard = upgradeCard(card1, card2);
    if (!upgradedCard) {
      toast({
        title: "Ошибка",
        description: "Не удалось улучшить карту",
        variant: "destructive"
      });
      return null;
    }

    // Handle pet type cards
    if (card1.type === 'pet') {
      const petDragon = gameData.selectedTeam?.find((pair: any) => 
        pair.dragon?.id === card1.id || pair.dragon?.id === card2.id
      );

      if (petDragon) {
        toast({
          title: "Ошибка улучшения",
          description: "Нельзя улучшить дракона, который используется в команде",
          variant: "destructive"
        });
        return null;
      }
    }

    // Remove both old cards and add upgraded card
    let updatedNormalized = batchRemoveCards(normalized, [card1.id, card2.id]);
    updatedNormalized = addCard(updatedNormalized, upgradedCard);
    
    const newCards = denormalizeCards(updatedNormalized);

    // Update database
    await updateGameData({ cards: newCards });

    // Dispatch update event
    window.dispatchEvent(new CustomEvent('cardsUpdate', {
      detail: { cards: newCards }
    }));

    toast({
      title: "Карта улучшена!",
      description: `${upgradedCard.name} улучшена до ${upgradedCard.rarity} редкости`,
    });

    return { updatedNormalized, upgradedCard };
  };

  /**
   * Batch sell multiple cards
   */
  const batchSellCards = async (
    cardIds: string[],
    normalized: NormalizedCards
  ) => {
    let totalPrice = 0;
    
    // Calculate total price
    cardIds.forEach(id => {
      const card = normalized.byId.get(id);
      if (card) {
        totalPrice += getCardPrice(card.rarity);
      }
    });

    const newBalance = gameData.balance + totalPrice;
    
    // Remove all cards at once
    const updatedNormalized = batchRemoveCards(normalized, cardIds);
    const newCards = denormalizeCards(updatedNormalized);
    
    // Update database
    await updateGameData({
      cards: newCards,
      balance: newBalance
    });

    toast({
      title: "Карты проданы",
      description: `Вы получили ${totalPrice} ELL за ${cardIds.length} карт`,
    });

    return { updatedNormalized, newBalance };
  };

  return {
    sellCard,
    performUpgrade,
    batchSellCards
  };
};
