import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateOpponents } from '@/utils/opponentGenerator';
import { PlayerStats, Opponent, StatUpgrade } from '@/types/battle';
import { Item } from '@/components/battle/Inventory';
import { useCombat } from './useCombat';
import { calculateRequiredExperience, upgradeStats, checkLevelUp } from '@/utils/experienceManager';

const INVENTORY_STORAGE_KEY = 'gameInventory';
const BATTLE_STATE_KEY = 'battleState';
const BALANCE_KEY = 'gameBalance';

export const useBattleState = (initialLevel: number = 1) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const loadSavedState = () => {
    const savedState = localStorage.getItem(BATTLE_STATE_KEY);
    if (savedState) {
      const parsed = JSON.parse(savedState);
      return {
        level: parsed.level || initialLevel,
        coins: Number(localStorage.getItem(BALANCE_KEY)) || 0,
        playerStats: parsed.playerStats || {
          health: 100,
          maxHealth: 100,
          power: 20,
          defense: 10,
          experience: 0,
          level: 1,
          requiredExperience: calculateRequiredExperience(1)
        },
        opponents: parsed.opponents || generateOpponents(initialLevel),
      };
    }
    return null;
  };

  const savedState = loadSavedState();
  const [level, setLevel] = useState(savedState?.level || initialLevel);
  const [coins, setCoins] = useState(savedState?.coins || 0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>(
    savedState?.playerStats || {
      health: 100,
      maxHealth: 100,
      power: 20,
      defense: 10,
      experience: 0,
      level: 1,
      requiredExperience: calculateRequiredExperience(1)
    }
  );

  const [opponents, setOpponents] = useState<Opponent[]>(
    savedState?.opponents || generateOpponents(initialLevel)
  );

  // Синхронизация баланса
  useEffect(() => {
    const handleBalanceUpdate = (e: CustomEvent<{ balance: number }>) => {
      setCoins(e.detail.balance);
      localStorage.setItem(BALANCE_KEY, e.detail.balance.toString());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BALANCE_KEY) {
        const newBalance = e.newValue ? parseInt(e.newValue, 10) : 0;
        setCoins(newBalance);
      }
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Синхронизация инвентаря
  useEffect(() => {
    const handleInventoryUpdate = (e: CustomEvent<{ inventory: Item[] }>) => {
      setInventory(e.detail.inventory);
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(e.detail.inventory));
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === INVENTORY_STORAGE_KEY) {
        const newInventory = e.newValue ? JSON.parse(e.newValue) : [];
        setInventory(newInventory);
      }
    };

    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Проверяем повышение уровня при изменении опыта
  useEffect(() => {
    if (playerStats && checkLevelUp(playerStats)) {
      const newStats = {
        ...playerStats,
        level: playerStats.level + 1,
        experience: playerStats.experience - playerStats.requiredExperience,
        requiredExperience: calculateRequiredExperience(playerStats.level + 1)
      };
      
      setPlayerStats(newStats);
      setShowLevelUp(true);
      setLevel(newStats.level);
      
      // Сохраняем обновленное состояние в localStorage
      const stateToSave = {
        level: newStats.level,
        coins,
        playerStats: newStats,
        opponents,
      };
      localStorage.setItem(BATTLE_STATE_KEY, JSON.stringify(stateToSave));
      
      toast({
        title: "🎉 Новый уровень!",
        description: "Выберите улучшение характеристик",
      });
    }
  }, [playerStats.experience, toast]);

  // Добавляем эффект для проверки здоровья
  useEffect(() => {
    if (playerStats.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Вы будете возвращены на главную страницу.",
        variant: "destructive"
      });
      
      // Очищаем состояние битвы
      localStorage.removeItem(BATTLE_STATE_KEY);
      
      // Небольшая задержка перед перенаправлением
      setTimeout(() => {
        navigate('/game');
      }, 2000);
    }
  }, [playerStats.health, navigate, toast]);

  const { isPlayerTurn, attackEnemy, handleOpponentAttack } = useCombat(
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    level,
    setLevel,
    coins,
    setCoins,
    setInventory
  );

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

  const handleUpgrade = (upgrade: StatUpgrade) => {
    const updatedStats = upgradeStats(playerStats, upgrade);
    setPlayerStats(updatedStats);
    setShowLevelUp(false);
    
    // Сохраняем обновленное состояние в localStorage
    const stateToSave = {
      level,
      coins,
      playerStats: updatedStats,
      opponents,
    };
    localStorage.setItem(BATTLE_STATE_KEY, JSON.stringify(stateToSave));
    
    toast({
      title: "Характеристики улучшены!",
      description: "Ваш герой стал сильнее!",
    });
  };

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
    const newInventory = inventory.filter(i => i.id !== item.id);
    setInventory(newInventory);
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(newInventory));
    
    // Отправляем событие обновления инвентаря
    const event = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(event);
  };

  return {
    level,
    coins,
    isPlayerTurn,
    playerStats,
    opponents,
    inventory,
    showLevelUp,
    attackEnemy,
    handleOpponentAttack,
    useItem,
    handleUpgrade
  };
};
