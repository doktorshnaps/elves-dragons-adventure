import { Item } from "@/types/inventory";
import { PlayerStats } from "@/types/battle";
import { useToast } from '@/hooks/use-toast';
import { useInitialBattleState } from './useInitialBattleState';
import { useItemInstances } from '@/hooks/useItemInstances';

export const useItemHandling = (
  playerStats: PlayerStats | null,
  setPlayerStats: (stats: PlayerStats) => void,
  updateInventory: (items: Item[]) => void,
  inventory: Item[]
) => {
  const { toast } = useToast();
  const initialState = useInitialBattleState();
  const { removeItemInstancesByIds } = useItemInstances();

  const useItem = async (item: Item) => {
    if (!playerStats) return;
    
    if (item.type === "healthPotion") {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      setPlayerStats({
        ...playerStats,
        health: newHealth
      });
      
      // Обновляем состояние в localStorage
      const savedStats = localStorage.getItem('adventurePlayerStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        stats.health = newHealth;
        localStorage.setItem('adventurePlayerStats', JSON.stringify(stats));
      }
      
      // Удаляем предмет из item_instances
      await removeItemInstancesByIds([item.id]);
      
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
      return;
    }
  };

  return { useItem };
};
