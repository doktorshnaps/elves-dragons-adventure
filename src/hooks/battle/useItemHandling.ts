import { Item } from "@/types/inventory";
import { PlayerStats } from "@/types/battle";
import { useToast } from '@/hooks/use-toast';

export const useItemHandling = (
  playerStats: PlayerStats | null,
  setPlayerStats: (stats: PlayerStats) => void,
  updateInventory: (items: Item[]) => void,
  inventory: Item[]
) => {
  const { toast } = useToast();

  const useItem = (item: Item) => {
    if (!playerStats) return;
    
    if (item.type === "healthPotion") {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      setPlayerStats({
        ...playerStats,
        health: newHealth
      });
      
      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${item.value} здоровья`,
        duration: 2000
      });
    } else if (item.type === "cardPack") {
      toast({
        title: "Недоступно",
        description: "Колоды карт можно использовать только в магазине",
        duration: 2000
      });
      return; // Не удаляем предмет, если это колода карт
    }

    // Удаляем использованный предмет из инвентаря
    const newInventory = inventory.filter(i => i.id !== item.id);
    updateInventory(newInventory);

    // Сохраняем обновленное состояние боя
    const battleState = {
      playerStats: playerStats,
      currentDungeonLevel: initialState.currentDungeonLevel,
      selectedDungeon: initialState.selectedDungeon
    };
    localStorage.setItem('battleState', JSON.stringify(battleState));
  };

  return { useItem };
};