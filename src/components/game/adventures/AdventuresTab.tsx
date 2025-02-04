import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { PlayerStatsCard } from "./PlayerStatsCard";
import { MonsterCard } from "./MonsterCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const AdventuresTab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    power: 10,
    defense: 5,
    level: 1,
    experience: 0,
    requiredExperience: 100
  });
  const [currentMonster, setCurrentMonster] = useState(null);

  const startAdventure = () => {
    // Логика генерации монстра
    const monster = {
      name: "Гоблин",
      health: 50,
      power: 5,
      reward: 10
    };
    setCurrentMonster(monster);
  };

  const attackMonster = () => {
    if (!currentMonster) return;

    // Логика боя
    const damage = Math.max(0, playerStats.power - Math.floor(Math.random() * 3));
    const newMonsterHealth = currentMonster.health - damage;

    if (newMonsterHealth <= 0) {
      // Монстр побежден
      updateBalance(balance + currentMonster.reward);
      toast({
        title: "Победа!",
        description: `Вы получили ${currentMonster.reward} монет!`
      });
      setCurrentMonster(null);
      return;
    }

    // Монстр наносит ответный удар
    const monsterDamage = Math.max(0, currentMonster.power - Math.floor(playerStats.defense / 2));
    const newPlayerHealth = playerStats.health - monsterDamage;

    if (newPlayerHealth <= 0) {
      toast({
        title: "Поражение!",
        description: "Вы проиграли бой...",
        variant: "destructive"
      });
      setPlayerStats({ ...playerStats, health: playerStats.maxHealth });
      setCurrentMonster(null);
      return;
    }

    setCurrentMonster({ ...currentMonster, health: newMonsterHealth });
    setPlayerStats({ ...playerStats, health: newPlayerHealth });
  };

  return (
    <div className="min-h-screen p-4 bg-game-background">
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
            stats={playerStats}
            onHeal={() => {
              if (balance >= 50 && playerStats.health < playerStats.maxHealth) {
                updateBalance(balance - 50);
                setPlayerStats({
                  ...playerStats,
                  health: Math.min(playerStats.maxHealth, playerStats.health + 50)
                });
                toast({
                  title: "Лечение",
                  description: "Восстановлено 50 очков здоровья"
                });
              }
            }}
          />

          <div className="space-y-4">
            {!currentMonster ? (
              <Button 
                className="w-full bg-game-accent hover:bg-game-accent/90"
                onClick={startAdventure}
              >
                Начать приключение
              </Button>
            ) : (
              <MonsterCard
                monster={currentMonster}
                onAttack={attackMonster}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};