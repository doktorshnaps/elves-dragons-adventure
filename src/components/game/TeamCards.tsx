import { useState } from "react";
import { Card as CardType } from "@/types/cards";
import { CardDisplay } from "./CardDisplay";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice } from "@/utils/cardUtils";

export const TeamCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const handleSellCard = (card: CardType) => {
    // Удаляем карту из списка
    const newCards = cards.filter(c => c.id !== card.id);
    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    // Обновляем баланс
    const price = getCardPrice(card.rarity);
    const currentBalance = Number(localStorage.getItem('gameBalance') || '0');
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());

    // Отправляем события об обновлении
    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);

    // Показываем уведомление
    toast({
      title: "Карта продана",
      description: `Вы получили ${price} токенов`,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.length > 0 ? (
        cards.map((card) => (
          <CardDisplay
            key={card.id}
            card={card}
            showSellButton={true}
            onSell={handleSellCard}
          />
        ))
      ) : (
        <p className="text-gray-400 col-span-full text-center py-8">
          У вас пока нет карт
        </p>
      )}
    </div>
  );
};