import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { PlayerStatsCard } from "./PlayerStatsCard";
import { MonsterCard } from "./MonsterCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AdventureLayout } from "./components/AdventureLayout";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { Item } from "@/types/inventory";

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();

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
    const monster = {
      name: "Гоблин",
      health: 50,
      maxHealth: 50,
      power: 5,
      reward: 10
    };
    setCurrentMonster(monster);
  };

  const handleExperienceGain = (amount: number) => {
    const newExperience = playerStats.experience + amount;
    const requiredExp = playerStats.requiredExperience;

    if (newExperience >= requiredExp) {
      // Level up
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
        health: baseStats.health + equipmentBonuses.health // Восстановление здоровья при повышении уровня
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

  const attackMonster = () => {
    if (!currentMonster || playerStats.health <= 0) return;

    const damage = Math.max(0, playerStats.power - Math.floor(Math.random() * 3));
    const newMonsterHealth = currentMonster.health - damage;

    if (newMonsterHealth <= 0) {
      updateBalance(balance + currentMonster.reward);
      handleExperienceGain(20);
      toast({
        title: "Победа!",
        description: `Вы получили ${currentMonster.reward} монет и 20 опыта!`
      });
      setCurrentMonster(null);
      return;
    }

    const monsterDamage = Math.max(0, currentMonster.power - Math.floor(playerStats.defense / 2));
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

    setCurrentMonster({ ...currentMonster, health: newMonsterHealth });
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

      // Get current inventory
      const inventory = localStorage.getItem('gameInventory');
      if (!inventory) return;

      // Parse and update inventory
      const items = JSON.parse(inventory);
      const updatedItems = items.filter((i: Item) => i.id !== item.id);
      
      // Save updated inventory
      localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
      
      // Dispatch inventory update event
      const event = new CustomEvent('inventoryUpdate', {
        detail: { inventory: updatedItems }
      });
      window.dispatchEvent(event);
    }
  };

  const handleSellItem = (item: Item) => {
    // Get current inventory
    const inventory = localStorage.getItem('gameInventory');
    if (!inventory) return;

    // Parse and update inventory
    const items = JSON.parse(inventory);
    const updatedItems = items.filter((i: Item) => i.id !== item.id);
    
    // Update balance (assuming each item sells for 10 coins)
    updateBalance(balance + 10);
    
    // Save updated inventory
    localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
    
    // Show toast
    toast({
      title: "Предмет продан",
      description: "Получено 10 монет"
    });
    
    // Dispatch inventory update event
    const event = new CustomEvent('inventoryUpdate', {
      detail: { inventory: updatedItems }
    });
    window.dispatchEvent(event);
  };

  return (
    <AdventureLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
            onClick={() => navigate('/menu')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться в меню
          </Button>
          <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlayerStatsCard
            level={playerStats.level}
            stats={{
              power: playerStats.power,
              defense: playerStats.defense
            }}
            experience={playerStats.experience}
            requiredExperience={playerStats.requiredExperience}
            playerHealth={playerStats.health}
            maxHealth={playerStats.maxHealth}
          />

          <div className="space-y-4">
            {!currentMonster ? (
              <Button 
                className="w-full bg-game-accent hover:bg-game-accent/90"
                onClick={startAdventure}
                disabled={playerStats.health <= 0}
              >
                {playerStats.health <= 0 ? "Герой мертв" : "Начать приключение"}
              </Button>
            ) : (
              <MonsterCard
                monster={currentMonster}
                onAttack={attackMonster}
                playerHealth={playerStats.health}
              />
            )}
          </div>
        </div>

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
