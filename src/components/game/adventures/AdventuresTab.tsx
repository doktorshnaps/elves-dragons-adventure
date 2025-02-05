
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

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const [playerStats, setPlayerStats] = useState(() => {
    const savedStats = localStorage.getItem('adventurePlayerStats');
    return savedStats ? JSON.parse(savedStats) : {
      health: 100,
      maxHealth: 100,
      power: 10,
      defense: 5,
      level: 1,
      experience: 0,
      requiredExperience: 100
    };
  });
  const [currentMonster, setCurrentMonster] = useState(() => {
    const savedMonster = localStorage.getItem('adventureCurrentMonster');
    return savedMonster ? JSON.parse(savedMonster) : null;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('adventurePlayerStats', JSON.stringify(playerStats));
  }, [playerStats]);

  useEffect(() => {
    localStorage.setItem('adventureCurrentMonster', JSON.stringify(currentMonster));
  }, [currentMonster]);

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
      const newRequiredExp = requiredExp + 100; // Increase required exp for next level
      
      setPlayerStats({
        ...playerStats,
        level: newLevel,
        experience: newExperience - requiredExp, // Carry over excess exp
        requiredExperience: newRequiredExp,
        maxHealth: playerStats.maxHealth + 10, // Increase max health on level up
        power: playerStats.power + 2, // Increase power on level up
        defense: playerStats.defense + 1, // Increase defense on level up
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
      
      // Задержка перед переходом в меню
      setTimeout(() => {
        navigate('/menu');
      }, 2000);
      
      return;
    }

    setCurrentMonster({ ...currentMonster, health: newMonsterHealth });
    setPlayerStats({ ...playerStats, health: newPlayerHealth });
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
          <InventoryDisplay showOnlyPotions={false} />
        </div>
      </div>
    </AdventureLayout>
  );
};

