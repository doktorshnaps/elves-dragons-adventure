import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { calculatePlayerDamage, calculateDamage } from '@/utils/battleCalculations';
import { generateOpponents } from '@/utils/opponentGenerator';
import { rollLoot, generateLootTable } from '@/utils/lootUtils';
import { PlayerStats, Opponent } from '@/types/battle';
import { Item } from '@/components/battle/Inventory';

const INVENTORY_STORAGE_KEY = 'gameInventory';
const BATTLE_STATE_KEY = 'battleState';

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Загружаем сохраненное состояние или используем начальные значения
  const loadSavedState = () => {
    const savedState = localStorage.getItem(BATTLE_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        level: parsed.level || initialLevel,
        coins: parsed.coins || 0,
        playerStats: parsed.playerStats || {
          health: 100,
          maxHealth: 100,
          power: 20,
          defense: 10,
        },
        opponents: parsed.opponents || generateOpponents(initialLevel),
      };
    }
    return null;
  };

  const savedState = loadSavedState();
  const [level, setLevel] = useState(savedState?.level || initialLevel);
  const [coins, setCoins] = useState(savedState?.coins || 0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return savedInventory ? JSON.parse(savedInventory) : [
      { id: 1, name: "Зелье здоровья", type: "healthPotion", value: 30 },
      { id: 2, name: "Зелье здоровья", type: "healthPotion", value: 30 },
      { id: 3, name: "Зелье защиты", type: "defensePotion", value: 20 },
    ];
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>(
    savedState?.playerStats || {
      health: 100,
      maxHealth: 100,
      power: 20,
      defense: 10,
    }
  );

  const [opponents, setOpponents] = useState<Opponent[]>(
    savedState?.opponents || generateOpponents(initialLevel)
  );

  // Сохраняем состояние при изменениях
  useEffect(() => {
    const stateToSave = {
      level,
      coins,
      playerStats,
      opponents,
    };
    localStorage.setItem(BATTLE_STATE_KEY, JSON.stringify(stateToSave));
  }, [level, coins, playerStats, opponents]);

  useEffect(() => {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory]);

  const useItem = (item: Item) => {
    const newStats = { ...playerStats };
    
    switch (item.type) {
      case "healthPotion":
        newStats.health = Math.min(newStats.health + item.value, newStats.maxHealth);
        toast({
          title: "Использовано зелье здоровья",
          description: `Восстановлено ${item.value} здоровья`,
        });
        break;
      case "defensePotion":
        newStats.defense += item.value;
        toast({
          title: "Использовано зелье защиты",
          description: `Увеличена защита на ${item.value}`,
        });
        break;
      case "weapon":
        newStats.power += item.value;
        toast({
          title: "Использовано оружие",
          description: `Увеличена сила атаки на ${item.value}`,
        });
        break;
      case "armor":
        newStats.defense += item.value;
        toast({
          title: "Использована броня",
          description: `Увеличена защита на ${item.value}`,
        });
        break;
    }

    setPlayerStats(newStats);
    setInventory(prev => prev.filter(i => i.id !== item.id));
  };

  const handleOpponentAttack = () => {
    if (opponents.length > 0 && !isPlayerTurn) {
      const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
      const { blockedDamage, damageToHealth, newDefense } = calculatePlayerDamage(
        randomOpponent.power,
        playerStats.defense
      );

      setPlayerStats(prev => {
        const newHealth = Math.max(0, prev.health - damageToHealth);
        
        let message = `${randomOpponent.name} атакует с силой ${randomOpponent.power}!`;
        if (blockedDamage > 0) {
          message += ` Защита блокирует ${blockedDamage} урона.`;
        }
        if (damageToHealth > 0) {
          message += ` Нанесено ${damageToHealth} урона здоровью!`;
        }
        message += ` Защита уменьшилась на ${prev.defense - newDefense} (${prev.defense} → ${newDefense}).`;
        
        toast({
          title: randomOpponent.isBoss ? "⚠️ Атака босса!" : "Враг атакует!",
          description: message,
          variant: randomOpponent.isBoss ? "destructive" : "default"
        });
        
        if (newHealth <= 0) {
          toast({
            title: "Игра окончена!",
            description: "Ваш герой пал в бою!",
            variant: "destructive",
          });
          // Очищаем сохранение при смерти
          localStorage.removeItem(BATTLE_STATE_KEY);
          navigate("/game");
        }
        
        return {
          ...prev,
          health: newHealth,
          defense: newDefense,
        };
      });

      setIsPlayerTurn(true);
    }
  };

  const attackEnemy = (enemyId: number) => {
    if (!isPlayerTurn) return;

    setOpponents(prevOpponents => {
      const newOpponents = prevOpponents.map(opponent => {
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
            // Генерируем лут при смерти противника
            const { items: droppedItems, coins: droppedCoins } = rollLoot(generateLootTable(opponent.isBoss ?? false));
            
            if (droppedItems.length > 0 || droppedCoins > 0) {
              let message = "";
              if (droppedItems.length > 0) {
                message += `Получены предметы: ${droppedItems.map(item => item.name).join(", ")}. `;
              }
              if (droppedCoins > 0) {
                message += `Получено ${droppedCoins} монет!`;
              }
              
              toast({
                title: "Получена награда!",
                description: message,
              });
              
              setInventory(prev => [...prev, ...droppedItems]);
              setCoins(prev => prev + droppedCoins);
            }
            
            return null;
          }
          
          return { ...opponent, health: newHealth };
        }
        return opponent;
      }).filter(Boolean);

      if (newOpponents.length === 0) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        
        const isBossDefeated = prevOpponents.some(op => op.isBoss);
        toast({
          title: isBossDefeated ? "🎊 Босс побежден! Новый уровень!" : "Уровень пройден!",
          description: `Вы перешли на уровень ${nextLevel}! ${nextLevel % 5 === 0 ? "Приготовьтесь к битве с боссом!" : ""}`,
        });

        return generateOpponents(nextLevel);
      }

      setIsPlayerTurn(false);
      return newOpponents;
    });
  };

  return {
    level,
    coins,
    isPlayerTurn,
    playerStats,
    opponents,
    inventory,
    attackEnemy,
    handleOpponentAttack,
    useItem
  };
};