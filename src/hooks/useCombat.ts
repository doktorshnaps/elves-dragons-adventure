import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { PlayerStats, Opponent } from '@/types/battle';
import { calculateDamage, calculatePlayerDamage } from '@/utils/battleCalculations';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { getExperienceReward } from '@/utils/experienceManager';
import { Item } from '@/components/battle/Inventory';

export const useCombat = (
  playerStats: PlayerStats,
  setPlayerStats: (stats: PlayerStats) => void,
  opponents: Opponent[],
  setOpponents: (opponents: Opponent[]) => void,
  level: number,
  setLevel: (level: number) => void,
  coins: number,
  setCoins: (coins: number) => void,
  setInventory: (items: Item[]) => void
) => {
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const { toast } = useToast();

  const updateInventory = (newItems: Item[]) => {
    const existingInventory = localStorage.getItem('gameInventory');
    const currentInventory: Item[] = existingInventory ? JSON.parse(existingInventory) : [];
    const updatedInventory = [...currentInventory, ...newItems];
    
    localStorage.setItem('gameInventory', JSON.stringify(updatedInventory));
    setInventory(updatedInventory);
    
    const event = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: updatedInventory }
    });
    window.dispatchEvent(event);
  };

  const updateBalance = (newCoins: number) => {
    const currentBalance = Number(localStorage.getItem('gameBalance')) || 0;
    const updatedBalance = currentBalance + newCoins;
    
    localStorage.setItem('gameBalance', updatedBalance.toString());
    setCoins(updatedBalance);
    
    const event = new CustomEvent('balanceUpdate', { 
      detail: { balance: updatedBalance }
    });
    window.dispatchEvent(event);
  };

  const attackEnemy = (enemyId: number) => {
    if (!isPlayerTurn) return;

    const newOpponents = opponents.map(opponent => {
      if (opponent.id === enemyId) {
        const { damage, isCritical } = calculateDamage(playerStats.power);
        const newHealth = opponent.health - damage;
        
        toast({
          title: opponent.isBoss ? 
            (isCritical ? "🎯 Критический удар по боссу!" : "⚔️ Атака босса!") :
            (isCritical ? "Критическая атака!" : "Атака!"),
          description: `Вы нанесли ${isCritical ? "критические " : ""}${damage.toFixed(0)} урона ${opponent.name}!`,
          variant: isCritical ? "destructive" : "default",
        });
        
        if (newHealth <= 0) {
          const newStats: PlayerStats = {
            ...playerStats,
            experience: playerStats.experience + opponent.experienceReward
          };
          setPlayerStats(newStats);

          const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
          
          if (droppedItems.length > 0 || droppedCoins > 0) {
            let message = "";
            if (droppedItems.length > 0) {
              message += `Получены предметы: ${droppedItems.map(item => item.name).join(", ")}. `;
              updateInventory(droppedItems);
            }
            if (droppedCoins > 0) {
              message += `Получено ${droppedCoins} монет!`;
              updateBalance(droppedCoins);
            }
            
            toast({
              title: "Получена награда!",
              description: message,
            });
          }
          
          return null;
        }
        
        return { ...opponent, health: newHealth };
      }
      return opponent;
    }).filter(Boolean) as Opponent[];

    setOpponents(newOpponents);
    setIsPlayerTurn(false);
  };

  const handleOpponentAttack = () => {
    if (opponents.length > 0 && !isPlayerTurn) {
      const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
      const { blockedDamage, damageToHealth, newDefense } = calculatePlayerDamage(
        randomOpponent.power,
        playerStats.defense
      );

      const newStats: PlayerStats = {
        ...playerStats,
        health: Math.max(0, playerStats.health - damageToHealth),
        defense: newDefense
      };
      
      setPlayerStats(newStats);
      
      let message = `${randomOpponent.name} атакует с силой ${randomOpponent.power}!`;
      if (blockedDamage > 0) {
        message += ` Защита блокирует ${blockedDamage} урона.`;
      }
      if (damageToHealth > 0) {
        message += ` Нанесено ${damageToHealth} урона здоровью!`;
      }
      message += ` Защита уменьилась на ${playerStats.defense - newDefense}.`;
      
      toast({
        title: randomOpponent.isBoss ? "⚠️ Атака босса!" : "Враг атакует!",
        description: message,
        variant: randomOpponent.isBoss ? "destructive" : "default"
      });

      setIsPlayerTurn(true);
    }
  };

  return {
    isPlayerTurn,
    attackEnemy,
    handleOpponentAttack,
  };
};