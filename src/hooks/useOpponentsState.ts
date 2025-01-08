import { useState, useEffect } from 'react';
import { Opponent } from '@/types/battle';
import { generateOpponents } from '@/utils/opponentGenerator';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { getExperienceReward, getLevelCompletionReward } from '@/utils/experienceManager';
import { useToast } from '@/hooks/use-toast';
import { Item } from '@/components/battle/Inventory';

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
    const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
    const experienceReward = getExperienceReward(level, opponent.isBoss ?? false);
    const completionReward = getLevelCompletionReward(opponent.isBoss ?? false);
    
    // Обновляем баланс с учетом всех наград
    const totalCoins = droppedCoins + completionReward;
    const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
    updateBalance(currentBalance + totalCoins);
    
    // Обновляем инвентарь
    if (droppedItems.length > 0) {
      const savedInventory = localStorage.getItem('gameInventory');
      const currentInventory = savedInventory ? JSON.parse(savedInventory) : [];
      updateInventory([...currentInventory, ...droppedItems]);
    }

    // Обновляем опыт игрока
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      state.playerStats.experience += experienceReward;
      
      // Проверяем, достаточно ли опыта для повышения уровня
      while (state.playerStats.experience >= state.playerStats.requiredExperience) {
        state.playerStats.level += 1;
        state.playerStats.experience -= state.playerStats.requiredExperience;
        state.playerStats.requiredExperience = Math.floor(state.playerStats.requiredExperience * 2);
        
        // Увеличиваем характеристики при повышении уровня
        state.playerStats.maxHealth += 20;
        state.playerStats.health = state.playerStats.maxHealth;
        state.playerStats.power += 5;
        state.playerStats.defense += 3;
        
        toast({
          title: "Уровень повышен!",
          description: `Достигнут ${state.playerStats.level} уровень! Характеристики улучшены.`,
        });
      }
      
      localStorage.setItem('battleState', JSON.stringify(state));
      
      // Отправляем событие обновления состояния
      const event = new CustomEvent('battleStateUpdate', { 
        detail: { state }
      });
      window.dispatchEvent(event);
    }
    
    // Показываем уведомление о наградах
    let message = `Получено ${experienceReward} опыта`;
    if (droppedItems.length > 0) {
      message += `, предметы: ${droppedItems.map(item => item.name).join(", ")}`;
    }
    if (totalCoins > 0) {
      message += `, ${totalCoins} монет`;
    }
    
    toast({
      title: opponent.isBoss ? "Босс побежден!" : "Враг побежден!",
      description: message,
    });
  };

  return { opponents, setOpponents, handleOpponentDefeat };
};