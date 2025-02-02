import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { Monster } from "./types";
import { MonsterCard } from "./MonsterCard";
import { PlayerStatsCard } from "./PlayerStatsCard";
import { useMonsterGeneration } from "./useMonsterGeneration";
import { InventoryDisplay } from "../InventoryDisplay";
import { useNavigate } from "react-router-dom";
import { Item } from "@/types/inventory";

export const AdventuresTab = () => {
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [requiredExperience, setRequiredExperience] = useState(100);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const { generateMonster } = useMonsterGeneration(level);
  const navigate = useNavigate();

  const calculatePlayerStats = () => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    
    let totalPower = 10;
    let totalDefense = 5;
    let totalHealth = 100;

    cards.forEach((card: any) => {
      if (card.power) totalPower += card.power;
      if (card.defense) totalDefense += card.defense;
      if (card.health) totalHealth += card.health;
    });

    return { power: totalPower, defense: totalDefense, maxHealth: totalHealth };
  };

  const handleUseItem = (item: Item) => {
    if (item.type === 'healthPotion') {
      const stats = calculatePlayerStats();
      const healAmount = item.value;
      const newHealth = Math.min(playerHealth + healAmount, stats.maxHealth);
      setPlayerHealth(newHealth);
      
      const savedInventory = localStorage.getItem('gameInventory');
      if (savedInventory) {
        const inventory = JSON.parse(savedInventory);
        const newInventory = inventory.filter((i: Item) => i.id !== item.id);
        localStorage.setItem('gameInventory', JSON.stringify(newInventory));
        const event = new CustomEvent('inventoryUpdate', { 
          detail: { inventory: newInventory }
        });
        window.dispatchEvent(event);
      }

      toast({
        title: "Зелье использовано",
        description: `Восстановлено ${healAmount} здоровья`,
      });
    }
  };

  const gainExperience = (amount: number) => {
    const newExperience = experience + amount;
    if (newExperience >= requiredExperience) {
      const nextLevel = level + 1;
      setLevel(nextLevel);
      setExperience(newExperience - requiredExperience);
      setRequiredExperience(Math.floor(requiredExperience * 1.5));
      
      toast({
        title: "Уровень повышен!",
        description: `Достигнут ${nextLevel} уровень!`,
        variant: "default"
      });
    } else {
      setExperience(newExperience);
    }
  };

  const startAdventure = () => {
    if (playerHealth <= 0) {
      toast({
        title: "Невозможно начать приключение",
        description: "Ваш герой слишком слаб. Восстановите здоровье!",
        variant: "destructive"
      });
      return;
    }
    
    const newMonster = generateMonster();
    setCurrentMonster(newMonster);
  };

  const attackMonster = () => {
    if (!currentMonster) return;

    const stats = calculatePlayerStats();
    
    const playerDamage = Math.floor(Math.random() * stats.power) + Math.floor(stats.power * 0.5);
    const newMonsterHealth = currentMonster.health - playerDamage;

    const monsterDamage = Math.floor(Math.random() * currentMonster.power);
    const reducedDamage = Math.max(0, monsterDamage - Math.floor(stats.defense * 0.5));
    const newPlayerHealth = playerHealth - reducedDamage;

    toast({
      title: "Битва!",
      description: `Вы нанесли ${playerDamage} урона! Монстр нанес ${reducedDamage} урона!`
    });

    if (newMonsterHealth <= 0) {
      const monsterReward = currentMonster.reward;
      updateBalance(balance + monsterReward);
      gainExperience(currentMonster.experienceReward);
      
      toast({
        title: "Победа!",
        description: `Вы получили ${monsterReward} монет и ${currentMonster.experienceReward} опыта!`
      });
      
      setCurrentMonster(null);
      return;
    }

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы проиграли битву...",
        variant: "destructive"
      });
      setPlayerHealth(0);
      setCurrentMonster(null);
      return;
    }

    setPlayerHealth(newPlayerHealth);
    setCurrentMonster({
      ...currentMonster,
      health: newMonsterHealth
    });
  };

  const restoreHealth = () => {
    if (balance < 50) {
      toast({
        title: "Недостаточно монет",
        description: "Нужно 50 монет для восстановления здоровья",
        variant: "destructive"
      });
      return;
    }

    const stats = calculatePlayerStats();
    updateBalance(balance - 50);
    setPlayerHealth(stats.maxHealth);
    toast({
      title: "Здоровье восстановлено",
      description: "Ваш герой готов к новым приключениям!"
    });
  };

  const stats = calculatePlayerStats();

  return (
    <div 
      className="min-h-screen p-6 relative"
      style={{
        backgroundImage: 'url("/lovable-uploads/59e5d39f-bbd6-4283-be9f-a8710e7cc372.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
            onClick={() => navigate('/game')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться в меню
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-200">Уровень: {level}</span>
            </div>
            <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
          </div>
        </div>

        <PlayerStatsCard
          level={level}
          stats={stats}
          experience={experience}
          requiredExperience={requiredExperience}
          playerHealth={playerHealth}
          maxHealth={stats.maxHealth}
          balance={balance}
          onRestoreHealth={restoreHealth}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Button 
              onClick={startAdventure} 
              disabled={!!currentMonster || playerHealth <= 0}
              className="w-full bg-game-primary hover:bg-game-secondary"
            >
              {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
            </Button>

            {currentMonster && (
              <MonsterCard
                monster={currentMonster}
                onAttack={attackMonster}
                playerHealth={playerHealth}
              />
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-game-accent">Инвентарь</h3>
            <InventoryDisplay onUseItem={handleUseItem} />
          </div>
        </div>
      </div>
    </div>
  );
};
