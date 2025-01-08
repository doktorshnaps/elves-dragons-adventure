import { Card } from "@/types/cards";
import { getCardPrice } from "@/utils/cardUtils";
import { CardDisplay } from "./CardDisplay";
import { useToast } from "@/hooks/use-toast";

interface TeamCardsProps {
  cards: Card[];
}

export const TeamCards = ({ cards }: TeamCardsProps) => {
  const { toast } = useToast();

  const handleSellCard = (card: Card) => {
    const price = getCardPrice(card.rarity);
    const currentBalance = parseInt(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    
    // Update balance
    localStorage.setItem('gameBalance', newBalance.toString());
    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);
    
    // Remove card from team
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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