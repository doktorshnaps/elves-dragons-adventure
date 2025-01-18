import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";

export const useTeamCards = () => {
  const { toast } = useToast();
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: CardType[] }>) => {
      setCards(e.detail.cards);
    };

    const handleStorageChange = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleSellCard = (card: CardType) => {
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
      description: `Вы получили ${price} токенов`,
    });
  };

  const handleCardSelect = (card: CardType, groupCount: number) => {
    const sameCards = cards.filter(c => 
      c.name === card.name && 
      c.rarity === card.rarity && 
      c.type === card.type && 
      c.faction === card.faction
    );

    if (selectedCards.some(c => sameCards.find(sc => sc.id === c.id))) {
      setSelectedCards([]);
      return;
    }

    if (selectedCards.length === 0) {
      setSelectedCards(sameCards.slice(0, 2));
    } else {
      const firstSelected = selectedCards[0];
      if (
        firstSelected.name === card.name &&
        firstSelected.rarity === card.rarity &&
        firstSelected.type === card.type &&
        firstSelected.faction === card.faction
      ) {
        setSelectedCards([...selectedCards, sameCards[0]]);
      } else {
        toast({
          title: "Несовместимые карты",
          description: "Выберите карты одного типа и редкости",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpgrade = () => {
    if (selectedCards.length !== 2) return;

    const upgradedCard = upgradeCard(selectedCards[0], selectedCards[1]);
    
    if (!upgradedCard) {
      toast({
        title: "Ошибка улучшения",
        description: "Выбранные карты должны быть одинаковыми и иметь одинаковую редкость",
        variant: "destructive",
      });
      return;
    }

    const newCards = cards.filter(c => !selectedCards.find(sc => sc.id === c.id));

    if (selectedCards[0].type === 'pet') {
      // Создаем новое яйцо только в контексте DragonEggs
      const { addEgg } = useDragonEggs();
      
      addEgg({
        id: Date.now().toString(),
        petName: upgradedCard.name,
        rarity: upgradedCard.rarity,
        createdAt: new Date().toISOString(),
        faction: upgradedCard.faction || 'Каледор'
      }, upgradedCard.faction || 'Каледор');

      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    setSelectedCards([]);
  };

  return {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  };
};