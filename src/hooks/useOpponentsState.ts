import { useState } from 'react';
import { Opponent } from '@/types/battle';
import { generateOpponents } from '@/utils/opponentGenerator';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
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
      // Если в сохраненном состоянии нет противников или их массив пуст, генерируем новых
      if (!parsed.opponents || parsed.opponents.length === 0) {
        return generateOpponents(level);
      }
      return parsed.opponents;
    }
    return generateOpponents(level);
  });

  const handleOpponentDefeat = (opponent: Opponent) => {
    const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
    
    if (droppedItems.length > 0 || droppedCoins > 0) {
      let message = "";
      if (droppedItems.length > 0) {
        message += `Получены предметы: ${droppedItems.map(item => item.name).join(", ")}. `;
        const savedInventory = localStorage.getItem('gameInventory');
        const currentInventory = savedInventory ? JSON.parse(savedInventory) : [];
        updateInventory([...currentInventory, ...droppedItems]);
      }
      if (droppedCoins > 0) {
        message += `Получено ${droppedCoins} монет!`;
        const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
        updateBalance(currentBalance + droppedCoins);
      }
      
      toast({
        title: "Получена награда!",
        description: message,
      });
    }
  };

  return { opponents, setOpponents, handleOpponentDefeat };
};