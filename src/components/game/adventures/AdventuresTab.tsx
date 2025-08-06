
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react'; // Add this import
import { useToast } from "@/hooks/use-toast";
import { useGameData } from "@/hooks/useGameData";
import { AdventureLayout } from "./components/AdventureLayout";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { useMonsterGeneration } from "./useMonsterGeneration";
import { Item } from "@/types/inventory";
import { Monster } from "./types";
import { GameHeader } from "./components/GameHeader";
import { GameContent } from "./components/GameContent";
import { usePlayerStats } from "./game/hooks/usePlayerStats";

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const balance = gameData.balance;
  const { generateMonster } = useMonsterGeneration(1);
  const { stats: playerStats, updateStats: setPlayerStats, addExperience } = usePlayerStats();

  const [currentMonster, setCurrentMonster] = useState<Monster | null>(() => {
    const savedMonster = localStorage.getItem('adventureCurrentMonster');
    return savedMonster ? JSON.parse(savedMonster) : null;
  });

  useEffect(() => {
    localStorage.setItem('adventureCurrentMonster', JSON.stringify(currentMonster));
  }, [currentMonster]);

  const startAdventure = () => {
    if (playerStats.health <= 0) return;
    const monster = generateMonster();
    setCurrentMonster(monster);
  };

  const handleMonsterDefeat = async (monster: Monster) => {
    if (!monster || playerStats.health <= 0) return;

    const damage = Math.max(0, playerStats.power - Math.floor(Math.random() * 3));
    const newMonsterHealth = monster.health - damage;

    if (newMonsterHealth <= 0) {
      await updateGameData({ balance: balance + monster.reward });
      addExperience(monster.experienceReward);
      toast({
        title: "Победа!",
        description: `Вы получили ${monster.reward} ELL и ${monster.experienceReward} опыта!`
      });
      
      if (playerStats.health > 0) {
        const newMonster = generateMonster();
        setCurrentMonster(newMonster);
      } else {
        setCurrentMonster(null);
      }
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
      setPlayerStats(prev => ({ ...prev, health: 0 }));
      setCurrentMonster(null);
      
      setTimeout(() => {
        navigate('/menu');
      }, 2000);
      
      return;
    }

    setCurrentMonster({ ...monster, health: newMonsterHealth });
    setPlayerStats(prev => ({ ...prev, health: newPlayerHealth }));
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

  const handleSellItem = async (item: Item) => {
    const inventory = localStorage.getItem('gameInventory');
    if (!inventory) return;

    const items = JSON.parse(inventory);
    const updatedItems = items.filter((i: Item) => i.id !== item.id);
    
    await updateGameData({ balance: balance + 10 });
    
    localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
    
    toast({
      title: "Предмет продан",
      description: "Получено 10 ELL"
    });
    
    const event = new CustomEvent('inventoryUpdate', {
      detail: { inventory: updatedItems }
    });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    if (!currentMonster && playerStats.health > 0) {
      startAdventure();
    }
  }, [currentMonster, playerStats.health]);

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

