import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";
import { Monster } from "./types";
import { MonsterCard } from "./MonsterCard";
import { PlayerStatsCard } from "./PlayerStatsCard";
import { useMonsterGeneration } from "./useMonsterGeneration";

export const AdventuresTab = () => {
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);
  const [requiredExperience, setRequiredExperience] = useState(100);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const { generateMonster } = useMonsterGeneration(level);

  const calculatePlayerStats = () => {
    // Получаем сохраненные карты из localStorage
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    
    // Базовые характеристики
    let totalPower = 10;
    let totalDefense = 5;
    let totalHealth = 100;

    // Подсчитываем бонусы от карт
    cards.forEach((card: any) => {
      if (card.power) totalPower += card.power;
      if (card.defense) totalDefense += card.defense;
      if (card.health) totalHealth += card.health;
    });

    return { power: totalPower, defense: totalDefense, maxHealth: totalHealth };
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
    
    // Расчет урона игрока
    const playerDamage = Math.floor(Math.random() * stats.power) + Math.floor(stats.power * 0.5);
    const newMonsterHealth = currentMonster.health - playerDamage;

    // Расчет урона монстра
    const monsterDamage = Math.floor(Math.random() * currentMonster.power);
    const reducedDamage = Math.max(0, monsterDamage - Math.floor(stats.defense * 0.5));
    const newPlayerHealth = playerHealth - reducedDamage;

    toast({
      title: "Битва!",
      description: `Вы нанесли ${playerDamage} урона! Монстр нанес ${reducedDamage} урона!`
    });

    if (newMonsterHealth <= 0) {
      // Победа над монстром
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-game-accent">Приключения</h2>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-400">Уровень: {level}</span>
          </div>
        </div>
        <Button onClick={startAdventure} disabled={!!currentMonster || playerHealth <= 0}>
          {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
        </Button>
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

      {currentMonster && (
        <MonsterCard
          monster={currentMonster}
          onAttack={attackMonster}
          playerHealth={playerHealth}
        />
      )}
    </div>
  );
};