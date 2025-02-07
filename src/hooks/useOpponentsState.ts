
import { useState, useEffect } from 'react';
import { Opponent } from '@/types/battle';
import { generateOpponents } from '@/utils/opponentGenerator';
import { generateLoot, generateLootTable } from '@/utils/lootUtils';
import { useToast } from '@/hooks/use-toast';
import { Item } from "@/types/inventory";

export const useOpponentsState = (
  level: number,
  updateBalance: (newBalance: number) => void,
  updateInventory: (items: Item[]) => void
) => {
  const { toast } = useToast();
  const [opponents, setOpponents] = useState<Opponent[]>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.opponents && parsed.opponents.length > 0) {
        return parsed.opponents;
      }
    }
    return generateOpponents(level);
  });

  useEffect(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (!parsed.opponents || parsed.opponents.length === 0) {
        setOpponents(generateOpponents(level));
      }
    } else {
      setOpponents(generateOpponents(level));
    }
  }, [level]);

  const handleOpponentDefeat = (opponent: Opponent) => {
    // Получаем награду за убийство
    const { items: droppedItems, coins: droppedCoins } = generateLoot(generateLootTable(opponent.isBoss ?? false));
    
    // Обновляем баланс только с учетом выпавших монет
    const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
    updateBalance(currentBalance + droppedCoins);
    
    // Обновляем инвентарь
    if (droppedItems.length > 0) {
      const savedInventory = localStorage.getItem('gameInventory');
      const currentInventory = savedInventory ? JSON.parse(savedInventory) : [];
      updateInventory([...currentInventory, ...droppedItems]);
    }

    // Проверяем, был ли это последний противник
    const remainingOpponents = opponents.filter(o => o.id !== opponent.id);
    if (remainingOpponents.length === 0) {
      // Если это был последний противник, начисляем награду за прохождение уровня
      const completionReward = opponent.isBoss ? 100 : 50;
      const newBalance = Number(localStorage.getItem('gameBalance')) || 0;
      updateBalance(newBalance + completionReward);
      
      toast({
        title: "Уровень пройден!",
        description: `Получено ${completionReward} монет за прохождение уровня`,
      });
    }
    
    // Показываем уведомление о наградах за убийство врага
    toast({
      title: opponent.isBoss ? "Босс побежден!" : "Враг побежден!",
      description: `Получено ${droppedCoins} монет`,
    });
  };

  return { opponents, setOpponents, handleOpponentDefeat };
};
