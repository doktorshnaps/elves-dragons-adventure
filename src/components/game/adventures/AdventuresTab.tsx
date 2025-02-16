
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { AdventureLayout } from "./components/AdventureLayout";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { Item } from "@/types/inventory";
import { GameHeader } from "./components/GameHeader";
import { usePlayerStats } from "./game/hooks/usePlayerStats";
import { MonsterSection } from "./components/MonsterSection";
import { Monster } from "./types";
import { useState } from "react";
import { generateLoot } from "@/data/monsterLoot";
import { LootItem } from "@/types/loot";

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const { stats: playerStats, updateStats: setPlayerStats, addExperience } = usePlayerStats();
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [recentLoot, setRecentLoot] = useState<LootItem[]>([]);

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
    
    updateBalance(balance + item.value);
    
    localStorage.setItem('gameInventory', JSON.stringify(updatedItems));
    
    toast({
      title: "Предмет продан",
      description: `Получено ${item.value} монет`
    });
    
    const event = new CustomEvent('inventoryUpdate', {
      detail: { inventory: updatedItems }
    });
    window.dispatchEvent(event);
  };

  const addLootToInventory = (loot: LootItem[]) => {
    const inventory = localStorage.getItem('gameInventory');
    const currentItems = inventory ? JSON.parse(inventory) : [];
    
    const newItems = loot.map(item => ({
      id: `${item.id}_${Date.now()}_${Math.random()}`,
      name: item.name,
      type: item.type,
      value: item.value,
      image: item.image,
      rarity: item.rarity
    }));
    
    const updatedInventory = [...currentItems, ...newItems];
    localStorage.setItem('gameInventory', JSON.stringify(updatedInventory));
    
    const event = new CustomEvent('inventoryUpdate', {
      detail: { inventory: updatedInventory }
    });
    window.dispatchEvent(event);
    
    setRecentLoot(loot);
  };

  const generateMonster = () => {
    const monsterTypes: Array<{ type: "normal" | "elite" | "boss", power: number, health: number, reward: number, expReward: number }> = [
      { type: "normal", power: 10, health: 50, reward: 20, expReward: 30 },
      { type: "elite", power: 15, health: 75, reward: 35, expReward: 60 },
      { type: "boss", power: 25, health: 100, reward: 50, expReward: 100 }
    ];

    const roll = Math.random();
    const typeData = roll < 0.7 ? monsterTypes[0] : roll < 0.95 ? monsterTypes[1] : monsterTypes[2];

    const monster: Monster = {
      id: Date.now(),
      name: `${typeData.type === 'boss' ? 'Босс: ' : typeData.type === 'elite' ? 'Элитный: ' : ''}Монстр`,
      power: typeData.power,
      health: typeData.health,
      maxHealth: typeData.health,
      reward: typeData.reward,
      experienceReward: typeData.expReward,
      type: typeData.type,
      position: 400
    };

    setCurrentMonster(monster);
  };

  const attackMonster = () => {
    if (!currentMonster) return;

    const damage = Math.floor(playerStats.power * (0.8 + Math.random() * 0.4));
    const newMonsterHealth = currentMonster.health - damage;

    toast({
      title: "Атака!",
      description: `Вы нанесли ${damage} урона`
    });

    if (newMonsterHealth <= 0) {
      const loot = generateLoot(currentMonster.type);
      addLootToInventory(loot);
      
      updateBalance(balance + currentMonster.reward);
      addExperience(currentMonster.experienceReward);
      
      toast({
        title: "Победа!",
        description: `Получено ${currentMonster.reward} монет и ${currentMonster.experienceReward} опыта`
      });

      if (loot.length > 0) {
        toast({
          title: "Получены предметы!",
          description: `${loot.map(item => item.name).join(", ")}`
        });
      }
      
      setCurrentMonster(null);
      return;
    }

    setCurrentMonster({
      ...currentMonster,
      health: newMonsterHealth
    });

    // Монстр наносит ответный удар
    const monsterDamage = Math.floor(currentMonster.power * (0.8 + Math.random() * 0.4));
    const newPlayerHealth = Math.max(0, playerStats.health - monsterDamage);

    toast({
      title: "Контратака!",
      description: `Монстр нанес ${monsterDamage} урона`,
      variant: "destructive"
    });

    setPlayerStats(prev => ({
      ...prev,
      health: newPlayerHealth
    }));

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы погибли",
        variant: "destructive"
      });
    }
  };

  return (
    <AdventureLayout>
      <div className="max-w-4xl mx-auto">
        <GameHeader 
          balance={balance} 
          onBack={() => navigate('/menu')} 
        />

        <div className="mt-6 space-y-6">
          {!currentMonster && (
            <button
              className="w-full px-4 py-2 bg-game-accent text-white rounded hover:bg-game-accent/90 disabled:opacity-50"
              onClick={generateMonster}
              disabled={playerStats.health <= 0}
            >
              {playerStats.health <= 0 ? "Вы мертвы" : "Начать битву"}
            </button>
          )}

          <MonsterSection
            currentMonster={currentMonster}
            attackMonster={attackMonster}
            playerHealth={playerStats.health}
          />

          {recentLoot.length > 0 && (
            <div className="p-4 bg-game-surface rounded-lg border border-game-accent">
              <h3 className="text-lg font-bold text-game-accent mb-2">Последние трофеи:</h3>
              <div className="flex flex-wrap gap-2">
                {recentLoot.map((item, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg ${
                      item.rarity === 'epic' ? 'bg-purple-900/50' :
                      item.rarity === 'rare' ? 'bg-blue-900/50' :
                      'bg-gray-900/50'
                    }`}
                  >
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-8 h-8 object-contain"
                      />
                    )}
                    <div className="text-sm text-white">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
