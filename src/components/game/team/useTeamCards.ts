import { useState, useCallback } from "react";
import { Card as CardType } from "@/types/cards";
import { useToast } from "@/hooks/use-toast";
import { getCardPrice, upgradeCard } from "@/utils/cardUtils";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useGameData } from "@/hooks/useGameData";
import { useQueryClient } from "@tanstack/react-query";
import { useCards } from "@/hooks/useCards";

export const useTeamCards = () => {
  const { toast } = useToast();
  const { addEgg } = useDragonEggs();
  const { updateGameData, gameData } = useGameData();
  const queryClient = useQueryClient();
  const { cards: allCards } = useCards();
  const [selectedCards, setSelectedCards] = useState<CardType[]>([]);

  const handleSellCard = useCallback(async (card: CardType) => {
    event?.stopPropagation();
    
    setSelectedCards(prev => prev.filter(c => c.id !== card.id));

    const price = getCardPrice(card.rarity);
    const newBalance = (gameData?.balance || 0) + price;
    
    // Обновляем баланс через Supabase
    await updateGameData({ balance: newBalance });

    // React Query invalidation для обновления UI
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });
    queryClient.invalidateQueries({ queryKey: ['gameData'] });

    toast({
      title: "Карта продана",
      description: `Вы получили ${price} ELL`,
    });
  }, [gameData?.balance, updateGameData, queryClient, toast]);

  const handleCardSelect = useCallback((card: CardType, groupCount: number) => {
    // Если в группе меньше 2 карт, игнорируем выбор
    if (groupCount < 2) {
      return;
    }

    // Находим все карты в группе
    const sameCards = allCards.filter(c => 
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
  }, [allCards, selectedCards.length]);

  const handleUpgrade = useCallback(async () => {
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

      toast({
        title: "Создано яйцо дракона!",
        description: `Улучшенный питомец появится через некоторое время`,
      });
    } else {
      // Для героев - улучшение идет через card_instances
      toast({
        title: "Карта улучшена!",
        description: `${upgradedCard.name} теперь имеет редкость ${upgradedCard.rarity}`,
      });
    }

    // React Query invalidation
    queryClient.invalidateQueries({ queryKey: ['cardInstances'] });

    // Очищаем выбранные карты
    setSelectedCards([]);
  }, [selectedCards, addEgg, queryClient, toast]);

  return {
    cards: allCards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  };
};