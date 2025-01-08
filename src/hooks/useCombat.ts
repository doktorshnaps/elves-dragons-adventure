import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateDamage, calculatePlayerDamage } from '@/utils/battleCalculations';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { generateOpponents } from '@/utils/opponentGenerator';
import { PlayerStats, Opponent } from '@/types/battle';
import { getExperienceReward, checkLevelUp } from '@/utils/experienceManager';
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
  setInventory: (items: Item[] | ((prev: Item[]) => Item[])) => void,
  isPlayerTurn: boolean,
  setIsPlayerTurn: (turn: boolean) => void
) => {
  const { toast } = useToast();

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
      localStorage.setItem('battleState', JSON.stringify({
        level,
        playerStats: newStats,
        opponents,
        isPlayerTurn: true
      }));
      
      let message = `${randomOpponent.name} атакует с силой ${randomOpponent.power}!`;
      if (blockedDamage > 0) {
        message += ` Защита блокирует ${blockedDamage} урона.`;
      }
      if (damageToHealth > 0) {
        message += ` Нанесено ${damageToHealth} урона здоровью!`;
      }
      message += ` Защита уменьшилась на ${playerStats.defense - newDefense}.`;
      
      toast({
        title: randomOpponent.isBoss ? "⚠️ Атака босса!" : "Враг атакует!",
        description: message,
        variant: randomOpponent.isBoss ? "destructive" : "default"
      });

      setIsPlayerTurn(true);
    }
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
          const experienceReward = getExperienceReward(opponent.isBoss ?? false);
          const newStats: PlayerStats = {
            ...playerStats,
            experience: playerStats.experience + experienceReward
          };
          setPlayerStats(newStats);
          localStorage.setItem('battleState', JSON.stringify({
            level,
            playerStats: newStats,
            opponents: opponents.filter(op => op.id !== enemyId),
            isPlayerTurn: false
          }));

          const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
          
          if (droppedItems.length > 0 || droppedCoins > 0) {
            let message = "";
            if (droppedItems.length > 0) {
              message += `Получены предметы: ${droppedItems.map(item => item.name).join(", ")}. `;
            }
            if (droppedCoins > 0) {
              message += `Получено ${droppedCoins} монет!`;
              const newCoins = coins + droppedCoins;
              setCoins(newCoins);
              localStorage.setItem('gameBalance', newCoins.toString());
              window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: { balance: newCoins } }));
            }
            
            toast({
              title: "Получена награда!",
              description: message,
            });
            
            setInventory((prev: Item[]) => {
              const newInventory = [...prev, ...droppedItems];
              localStorage.setItem('gameInventory', JSON.stringify(newInventory));
              window.dispatchEvent(new CustomEvent('inventoryUpdate', { detail: { inventory: newInventory } }));
              return newInventory;
            });
          }
          
          return null;
        }
        
        return { ...opponent, health: newHealth };
      }
      return opponent;
    }).filter(Boolean) as Opponent[];

    if (newOpponents.length === 0) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      
      const isBossDefeated = opponents.some(op => op.isBoss);
      toast({
        title: isBossDefeated ? "🎊 Босс побежден! Новый уровень!" : "Уровень пройден!",
        description: `Вы перешли на уровень ${nextLevel}! ${nextLevel % 5 === 0 ? "Приготовьтесь к битве с боссом!" : ""}`,
      });

      const newOpponents = generateOpponents(nextLevel);
      setOpponents(newOpponents);
      setIsPlayerTurn(true);
      
      localStorage.setItem('battleState', JSON.stringify({
        level: nextLevel,
        playerStats,
        opponents: newOpponents,
        isPlayerTurn: true
      }));
    } else {
      setOpponents(newOpponents);
      setIsPlayerTurn(false);
      
      localStorage.setItem('battleState', JSON.stringify({
        level,
        playerStats,
        opponents: newOpponents,
        isPlayerTurn: false
      }));
    }
  };

  return {
    attackEnemy,
    handleOpponentAttack,
  };
};