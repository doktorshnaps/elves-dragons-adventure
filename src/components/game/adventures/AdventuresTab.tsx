import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { AdventureLayout } from "./components/AdventureLayout";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { useMonsterGeneration } from "./useMonsterGeneration";
import { Item } from "@/types/inventory";
import { Monster } from "./types";
import { GameHeader } from "./components/GameHeader";
import { GameContent } from "./components/GameContent";

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const { generateMonster } = useMonsterGeneration(1);

  const calculateEquipmentBonuses = () => {
    const inventory = localStorage.getItem('gameInventory');
    if (!inventory) return { power: 0, defense: 0, health: 0 };

    const equippedItems = JSON.parse(inventory).filter((item: any) => item.equipped);
    return equippedItems.reduce((acc: any, item: any) => ({
      power: acc.power + (item.stats?.power || 0),
      defense: acc.defense + (item.stats?.defense || 0),
      health: acc.health + (item.stats?.health || 0)
    }), { power: 0, defense: 0, health: 0 });
  };

  const calculateBaseStats = (level: number) => {
    return {
      power: 1 + (level - 1),
      defense: 1 + (level - 1),
      health: 50 + (level - 1) * 10
    };
  };

  const [playerStats, setPlayerStats] = useState(() => {
    const savedStats = localStorage.getItem('adventurePlayerStats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      const baseStats = calculateBaseStats(parsed.level);
      const equipmentBonuses = calculateEquipmentBonuses();
      
      return {
        ...parsed,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: baseStats.health + equipmentBonuses.health,
        health: Math.min(parsed.health, baseStats.health + equipmentBonuses.health)
      };
    }

    const baseStats = calculateBaseStats(1);
    const equipmentBonuses = calculateEquipmentBonuses();
    
    return {
      health: baseStats.health + equipmentBonuses.health,
      maxHealth: baseStats.health + equipmentBonuses.health,
      power: baseStats.power + equipmentBonuses.power,
      defense: baseStats.defense + equipmentBonuses.defense,
      level: 1,
      experience: 0,
      requiredExperience: 100
    };
  });

  const [currentMonster, setCurrentMonster] = useState(() => {
    const savedMonster = localStorage.getItem('adventureCurrentMonster');
    return savedMonster ? JSON.parse(savedMonster) : null;
  });

  useEffect(() => {
    localStorage.setItem('adventurePlayerStats', JSON.stringify(playerStats));
  }, [playerStats]);

  useEffect(() => {
    localStorage.setItem('adventureCurrentMonster', JSON.stringify(currentMonster));
  }, [currentMonster]);

  useEffect(() => {
    const handleInventoryUpdate = () => {
      const baseStats = calculateBaseStats(playerStats.level);
      const equipmentBonuses = calculateEquipmentBonuses();
      
      setPlayerStats(prev => ({
        ...prev,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: baseStats.health + equipmentBonuses.health,
        health: Math.min(prev.health, baseStats.health + equipmentBonuses.health)
      }));
    };

    window.addEventListener('storage', handleInventoryUpdate);
    window.addEventListener('inventoryUpdate', handleInventoryUpdate);

    return () => {
      window.removeEventListener('storage', handleInventoryUpdate);
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate);
    };
  }, [playerStats.level]);

  const startAdventure = () => {
    const monster = generateMonster();
    setCurrentMonster(monster);
  };

  const handleExperienceGain = (amount: number) => {
    const newExperience = playerStats.experience + amount;
    const requiredExp = playerStats.requiredExperience;

    if (newExperience >= requiredExp) {
      const newLevel = playerStats.level + 1;
      const newRequiredExp = requiredExp + 100;
      const baseStats = calculateBaseStats(newLevel);
      const equipmentBonuses = calculateEquipmentBonuses();
      
      setPlayerStats({
        ...playerStats,
        level: newLevel,
        experience: newExperience - requiredExp,
        requiredExperience: newRequiredExp,
        power: baseStats.power + equipmentBonuses.power,
        defense: baseStats.defense + equipmentBonuses.defense,
        maxHealth: baseStats.health + equipmentBonuses.health,
        health: baseStats.health + equipmentBonuses.health
      });

      toast({
        title: "Уровень повышен!",
        description: `Достигнут ${newLevel} уровень!`
      });
    } else {
      setPlayerStats({
        ...playerStats,
        experience: newExperience
      });
    }
  };

  const handleMonsterDefeat = (monster: Monster) => {
    if (!monster || playerStats.health <= 0) return;

    const damage = Math.max(0, playerStats.power - Math.floor(Math.random() * 3));
    const newMonsterHealth = monster.health - damage;

    if (newMonsterHealth <= 0) {
      updateBalance(balance + monster.reward);
      handleExperienceGain(monster.experienceReward);
      toast({
        title: "Победа!",
        description: `Вы получили ${monster.reward} монет и ${monster.experienceReward} опыта!`
      });
      setCurrentMonster(null);
      return;
    }

    const monsterDamage = Math.max(0, monster.power - Math.floor(playerStats.defense / 2));
    const newPlayerHealth = playerStats.health - monsterDamage;

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы проиграли бой...",
        variant: "destructive"
      });
      setPlayerStats({ ...playerStats, health: 0 });
      setCurrentMonster(null);
      
      setTimeout(() => {
        navigate('/menu');
      }, 2000);
      
      return;
    }

    setCurrentMonster({ ...monster, health: newMonsterHealth });
    setPlayerStats({ ...playerStats, health: newPlayerHealth });
  };

  const handleUseItem = (item: Item) => {
    if (item.type === "healthPotion") {
      const newHealth = Math.min(playerStats.maxHealth, playerStats.health + item.value);
      setPlayerStats(prev => ({
        ...prev,
        health: newHealth
      }));
      
      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${item.value} здоровья`
      });

      const inventory = localStorage.getItem('gameInventory');
      if (!inventory) return;

      const items = JSON.parse(inventory);
      const updatedItems = items.filter((i: Item) => i.id !== item.id);
      
      localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
      
      const event = new CustomEvent('inventoryUpdate', {
        detail: { inventory: updatedItems }
      });
      window.dispatchEvent(event);
    }
  };

  const handleSellItem = (item: Item) => {
    const inventory = localStorage.getItem('gameInventory');
    if (!inventory) return;

    const items = JSON.parse(inventory);
    const updatedItems = items.filter((i: Item) => i.id !== item.id);
    
    updateBalance(balance + 10);
    
    localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
    
    toast({
      title: "Предмет продан",
      description: "Получено 10 монет"
    });
    
    const event = new CustomEvent('inventoryUpdate', {
      detail: { inventory: updatedItems }
    });
    window.dispatchEvent(event);
  };

  return (
    <AdventureLayout>
      <div className="max-w-4xl mx-auto">
        <GameHeader 
          balance={balance} 
          onBack={() => navigate('/menu')} 
        />

        <GameContent
          currentMonster={currentMonster}
          onMonsterDefeat={handleMonsterDefeat}
          playerStats={playerStats}
          onStartAdventure={startAdventure}
        />

        <div className="mt-6">
          <InventoryDisplay 
            showOnlyPotions={false} 
            onUseItem={handleUseItem}
            onSellItem={handleSellItem}
          />
        </div>
      </div>
    </AdventureLayout>
  );
};
