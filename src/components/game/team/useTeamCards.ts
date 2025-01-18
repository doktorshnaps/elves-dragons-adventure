import { useState, useEffect } from "react";
import { Card } from "@/types/cards";
import { useToast } from "@/hooks/use-toast";
import { useDragonEggs } from "@/contexts/DragonEggContext";

export const useTeamCards = () => {
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const { toast } = useToast();
  const { addEgg } = useDragonEggs();

  useEffect(() => {
    localStorage.setItem('gameCards', JSON.stringify(cards));
  }, [cards]);

  const handleSellCard = (cardToSell: Card) => {
    const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
    const sellPrice = cardToSell.rarity * 10;
    
    localStorage.setItem('gameBalance', String(currentBalance + sellPrice));
    setCards(prevCards => prevCards.filter(card => card.id !== cardToSell.id));
    
    const balanceEvent = new CustomEvent('balanceUpdate', {
      detail: { balance: currentBalance + sellPrice }
    });
    window.dispatchEvent(balanceEvent);

    toast({
      title: "Карта продана",
      description: `Получено ${sellPrice} монет`,
    });
  };

  const handleCardSelect = (card: Card, count: number) => {
    if (selectedCards.find(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
      return;
    }

    if (count >= 3 && selectedCards.length === 0) {
      setSelectedCards([card]);
    } else {
      toast({
        title: "Недостаточно карт",
        description: "Для улучшения нужно 3 одинаковые карты",
        variant: "destructive"
      });
    }
  };

  const handleUpgrade = () => {
    if (selectedCards.length === 0) {
      toast({
        title: "Выберите карты",
        description: "Сначала выберите карты для улучшения",
        variant: "destructive"
      });
      return;
    }

    const upgradedCard: Card = {
      ...selectedCards[0],
      id: Date.now().toString(),
      rarity: selectedCards[0].rarity + 1,
    };

    const newCards = cards.filter(c => !selectedCards.find(sc => sc.id === c.id));

    if (selectedCards[0].type === 'pet') {
      const currentInventory = localStorage.getItem('gameInventory');
      const inventory = currentInventory ? JSON.parse(currentInventory) : [];
      
      // Создаем только один предмет в инвентаре - стандартное яйцо дракона
      const newEggItem = {
        id: Date.now().toString(),
        name: "Яйцо дракона",
        type: 'dragon_egg' as const,
        description: "Требует инкубации",
        value: 1,
        image: "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
      };
      
      inventory.push(newEggItem);
      localStorage.setItem('gameInventory', JSON.stringify(inventory));

      // Добавляем информацию о яйце в контекст
      addEgg({
        id: newEggItem.id,
        petName: upgradedCard.name,
        rarity: upgradedCard.rarity,
        createdAt: new Date().toISOString(),
        faction: upgradedCard.faction || 'Каледор'
      }, upgradedCard.faction || 'Каледор');

      const inventoryEvent = new CustomEvent('inventoryUpdate', {
        detail: { inventory }
      });
      window.dispatchEvent(inventoryEvent);

      toast({
        title: "Создано яйцо дракона!",
        description: "Проверьте инвентарь",
      });
    }

    setCards([...newCards, upgradedCard]);
    setSelectedCards([]);

    toast({
      title: "Улучшение выполнено!",
      description: `${upgradedCard.name} улучшен до редкости ${upgradedCard.rarity}`,
    });
  };

  return {
    cards,
    selectedCards,
    handleSellCard,
    handleCardSelect,
    handleUpgrade
  };
};