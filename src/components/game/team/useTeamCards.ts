import { useState, useEffect } from "react";
import { Card as CardType } from "@/types/cards";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useGameData } from "@/hooks/useGameData";
import { useQueryClient } from "@tanstack/react-query";
import { Item } from "@/types/inventory";

export const useTeamCards = () => {
  const { toast } = useToast();
  const { addEgg } = useDragonEggs();
  const { gameData, updateGameData } = useGameData();
  const queryClient = useQueryClient();
  const [cards, setCards] = useState<CardType[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        setCards(JSON.parse(savedCards));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(handleStorageChange, 500);

    return () => {
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

    // Используем React Query invalidation вместо window.dispatchEvent
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
    queryClient.invalidateQueries({ queryKey: ['gameData'] });

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
        faction: upgradedCard.faction || 'Каледор',
        incubationStarted: false,
      }, upgradedCard.faction || 'Каледор');

      // Яйца НЕ добавляются в inventory - они управляются через DragonEggContext
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

    // Обновляем состояние, Supabase и localStorage
    setCards(newCards);
    await updateGameData({ cards: newCards });
    localStorage.setItem('gameCards', JSON.stringify(newCards));

    // Используем React Query invalidation вместо window.dispatchEvent
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });

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