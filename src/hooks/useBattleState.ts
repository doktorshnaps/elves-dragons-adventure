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
        isPlayerTurn: parsed.isPlayerTurn !== undefined ? parsed.isPlayerTurn : true
      };
    }
    return null;
  };

  const savedState = loadSavedState();
  const [level, setLevel] = useState(savedState?.level || initialLevel);
  const [coins, setCoins] = useState(savedState?.coins || 0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(savedState?.isPlayerTurn ?? true);
  
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
      experience: 0,
      level: 1,
      requiredExperience: calculateRequiredExperience(1)
    }
  );

  const [opponents, setOpponents] = useState<Opponent[]>(
    savedState?.opponents || generateOpponents(initialLevel)
  );

  // Сохраняем состояние при каждом изменении
  useEffect(() => {
    const stateToSave = {
      level,
      coins,
      playerStats,
      opponents,
      isPlayerTurn
    };
    localStorage.setItem(BATTLE_STATE_KEY, JSON.stringify(stateToSave));
    localStorage.setItem(BALANCE_KEY, coins.toString());
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [level, coins, playerStats, opponents, inventory, isPlayerTurn]);

  // Обработка уровней
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
      
      toast({
        title: "🎉 Новый уровень!",
        description: "Выберите улучшение характеристик",
      });
    }
  }, [playerStats.experience, toast]);

  // Проверка здоровья
  useEffect(() => {
    if (playerStats.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою. Вы будете возвращены на главную страницу.",
        variant: "destructive"
      });
      
      localStorage.removeItem(BATTLE_STATE_KEY);
      
      setTimeout(() => {
        navigate('/game');
      }, 2000);
    }
  }, [playerStats.health, navigate, toast]);

  const { attackEnemy, handleOpponentAttack } = useCombat(
    playerStats,
    setPlayerStats,
    opponents,
    setOpponents,
    level,
    setLevel,
    coins,
    setCoins,
    setInventory,
    isPlayerTurn,
    setIsPlayerTurn
  );

  const handleUpgrade = (upgrade: StatUpgrade) => {
    const updatedStats = upgradeStats(playerStats, upgrade);
    setPlayerStats(updatedStats);
    setShowLevelUp(false);
    
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
    setInventory(prev => prev.filter(i => i.id !== item.id));
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