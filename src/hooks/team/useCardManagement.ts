import { Card } from "@/types/cards";
import { useToast } from '@/hooks/use-toast';
import { getCardPrice } from '@/utils/cardUtils';

export const useCardManagement = (
  cards: Card[],
  setCards: (cards: Card[]) => void,
  setSelectedCards: React.Dispatch<React.SetStateAction<Card[]>>
) => {
  const { toast } = useToast();

  const handleSellCard = (card: Card) => {
    event?.stopPropagation();
    
    setSelectedCards(prev => prev.filter(c => c.id !== card.id));

    const newCards = cards.filter(c => c.id !== card.id);
    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const price = getCardPrice(card.rarity);
    const currentBalance = Number(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} ELL`,
    });
  };

  return { handleSellCard };
};