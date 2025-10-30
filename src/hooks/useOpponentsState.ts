import { useState, useEffect } from 'react';
import { Opponent } from '@/types/battle';
import { generateOpponents } from '@/utils/opponentGenerator';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { useToast } from '@/hooks/use-toast';
import { Item } from "@/types/inventory";
import { useAddItemToInstances } from '@/hooks/useAddItemToInstances';

export const useOpponentsState = (
  level: number,
  updateBalance: (newBalance: number) => void,
  updateInventory: (items: Item[]) => void
) => {
  const { toast } = useToast();
  const { addItemsToInstances } = useAddItemToInstances();
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

  const handleOpponentDefeat = async (opponent: Opponent) => {
    // Получаем награду за убийство
    const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
    
    // Обновляем баланс только с учетом выпавших ELL
    const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
    updateBalance(currentBalance + droppedCoins);
    
    // Добавляем дроп ТОЛЬКО в item_instances (единственный источник истины)
    if (droppedItems.length > 0) {
      await addItemsToInstances(droppedItems.map(it => ({
        name: it.name,
        type: it.type
      })));
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
        description: `Получено ${completionReward} ELL за прохождение уровня`,
      });
    }
    
    // Показываем уведомление о наградах за убийство врага
    toast({
      title: opponent.isBoss ? "Босс побежден!" : "Враг побежден!",
      description: `Получено ${droppedCoins} ELL`,
    });
  };

  return { opponents, setOpponents, handleOpponentDefeat };
};
