import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useGameData } from "@/hooks/useGameData";
import { Item } from "@/types/inventory";

export const useTeamCards = () => {
  const { toast } = useToast();
  const { addEgg } = useDragonEggs();
  const { gameData, updateGameData } = useGameData();
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

  const handleCardSelect = (card: CardType, groupCount: number) => {
    // Если в группе меньше 2 карт, игнорируем выбор
    if (groupCount < 2) {
      return;
    }

    // Находим все карты в группе
    const sameCards = cards.filter(c => 
      c.name === card.name && 
      c.rarity === card.rarity && 
      c.type === card.type && 
      c.faction === card.faction
    );

    // Если карты уже выбраны, снимаем выбор
    if (selectedCards.length === 2) {
      setSelectedCards([]);
      return;
    }

    // Автоматически выбираем первые две карты из стопки
    setSelectedCards([sameCards[0], sameCards[1]]);
  };

  const handleUpgrade = async () => {
    if (selectedCards.length !== 2) {
      toast({
        title: "Ошибка улучшения",
        description: "Выберите две одинаковые карты для улучшения",
        variant: "destructive",
      });
      return;
    }

    const upgradedCard = upgradeCard(selectedCards[0], selectedCards[1]);
    
    if (!upgradedCard) {
      toast({
        title: "Ошибка улучшения",
        description: "Выбранные карты должны быть одинаковыми и иметь одинаковую редкость",
        variant: "destructive",
      });
      return;
    }

    // Удаляем выбранные карты из общего списка
    const newCards = cards.filter(c => !selectedCards.some(sc => sc.id === c.id));

    if (selectedCards[0].type === 'pet') {
      // Для питомцев создаем яйцо и добавляем его в инвентарь
      const eggId = Date.now().toString();
      const createdAt = new Date().toISOString();

      addEgg({
        id: eggId,
        petName: upgradedCard.name,
        rarity: upgradedCard.rarity,
        createdAt,
        faction: upgradedCard.faction || 'Каледор'
      }, upgradedCard.faction || 'Каледор');

      const eggItem: Item = {
        id: eggId,
        name: 'Яйцо дракона',
        type: 'dragon_egg',
        value: upgradedCard.rarity,
        description: `${upgradedCard.name}`,
        image: '/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png',
        petName: upgradedCard.name,
      };
      await updateGameData({ inventory: [ ...(gameData.inventory || []), eggItem ] });

      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      // Для героев добавляем улучшенную карту
      newCards.push(upgradedCard);
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

    // Обновляем состояние и localStorage
    setCards(newCards);
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    // Отправляем событие обновления карт
    const cardsEvent = new CustomEvent('cardsUpdate', { 
      detail: { cards: newCards }
    });
    window.dispatchEvent(cardsEvent);

    // Очищаем выбранные карты
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