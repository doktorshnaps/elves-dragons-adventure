import { Card } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';
import { getCardPrice } from '@/utils/cardUtils';
import { useGameData } from '@/hooks/useGameData';

export const useCardManagement = (
  cards: Card[],
  setCards: (cards: Card[]) => void,
  setSelectedCards: React.Dispatch<React.SetStateAction<Card[]>>
) => {
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();

  const handleSellCard = async (card: Card) => {
    event?.stopPropagation();
    
    setSelectedCards(prev => prev.filter(c => c.id !== card.id));

    const newCards = cards.filter(c => c.id !== card.id);
    const price = getCardPrice(card.rarity);
    const newBalance = gameData.balance + price;
    
    // Обновляем в Supabase
    await updateGameData({
      cards: newCards,
      balance: newBalance
    });
    
    // Обновляем локальное состояние
    setCards(newCards);

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} ELL`,
    });
  };

  return { handleSellCard };
};