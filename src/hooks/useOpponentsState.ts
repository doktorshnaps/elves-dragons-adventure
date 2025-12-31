import { useState, useEffect } from 'react';
import { Opponent } from '@/types/battle';
import { generateOpponents } from '@/utils/opponentGenerator';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { useToast } from '@/hooks/use-toast';
import { Item } from "@/types/inventory";
import { useGameStore } from '@/stores/gameStore';

/**
 * РЕФАКТОРИНГ: Убрано чтение gameBalance из localStorage
 * Теперь баланс берётся из Zustand store (синхронизирован с Supabase)
 */
export const useOpponentsState = (
  level: number,
  updateBalance: (newBalance: number) => void,
  updateInventory: (items: Item[]) => void
) => {
  const { toast } = useToast();
  const currentBalance = useGameStore((state) => state.balance);
  
  const [opponents, setOpponents] = useState<Opponent[]>(() => {
    // Проверяем только в памяти через Zustand, не localStorage
    return generateOpponents(level);
  });

  useEffect(() => {
    // Генерируем новых противников при смене уровня
    setOpponents(generateOpponents(level));
  }, [level]);

  const handleOpponentDefeat = async (opponent: Opponent) => {
    // Получаем награду за убийство (только ELL, предметы начисляются через claim в useDungeonRewards)
    const { coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
    
    // Обновляем баланс используя текущий баланс из store
    updateBalance(currentBalance + droppedCoins);

    // Проверяем, был ли это последний противник
    const remainingOpponents = opponents.filter(o => o.id !== opponent.id);
    if (remainingOpponents.length === 0) {
      // Если это был последний противник, начисляем награду за прохождение уровня
      const completionReward = opponent.isBoss ? 100 : 50;
      // Используем обновлённый баланс (currentBalance + droppedCoins)
      updateBalance(currentBalance + droppedCoins + completionReward);
      
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
