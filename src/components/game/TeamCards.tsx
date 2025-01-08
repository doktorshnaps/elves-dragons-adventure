import { Card } from "@/types/cards";
import { getCardPrice } from "@/utils/cardUtils";
import { CardDisplay } from "./CardDisplay";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface TeamCardsProps {
  cards: Card[];
}

export const TeamCards = ({ cards }: TeamCardsProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleSellCard = (card: Card) => {
    const price = getCardPrice(card.rarity);
    const currentBalance = parseInt(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    
    localStorage.setItem('gameBalance', newBalance.toString());
    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);
    
    const currentCards = cards.filter(c => c.id !== card.id);
    localStorage.setItem('gameCards', JSON.stringify(currentCards));
    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: currentCards }
    });
    window.dispatchEvent(cardsEvent);
    
    toast({
      title: "Карта продана",
      description: `${card.name} продан(а) за ${price} монет`,
    });
  };

  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-4'}`}>
      {cards.map((card) => (
        <CardDisplay
          key={card.id}
          card={card}
          showSellButton={true}
          onSell={handleSellCard}
        />
      ))}
    </div>
  );
};