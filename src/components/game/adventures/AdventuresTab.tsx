import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sword, ArrowRight, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useBalanceState } from "@/hooks/useBalanceState";

interface Monster {
  id: number;
  name: string;
  power: number;
  health: number;
  maxHealth: number;
  reward: number;
}

export const AdventuresTab = () => {
  const [level, setLevel] = useState(1);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [playerHealth, setPlayerHealth] = useState(100);
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();

  const generateMonster = () => {
    const powerMultiplier = 1 + (level - 1) * 0.5;
    const healthMultiplier = 1 + (level - 1) * 0.3;
    const rewardMultiplier = 1 + (level - 1) * 0.7;

    const monsters = [
      "Дикий волк",
      "Горный тролль",
      "Лесной разбойник",
      "Древний голем",
      "Темный маг"
    ];

    const monsterName = monsters[Math.floor(Math.random() * monsters.length)];
    
    return {
      id: Date.now(),
      name: monsterName,
      power: Math.floor(10 * powerMultiplier),
      health: Math.floor(50 * healthMultiplier),
      maxHealth: Math.floor(50 * healthMultiplier),
      reward: Math.floor(20 * rewardMultiplier)
    };
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

    // Игрок наносит урон монстру
    const playerDamage = Math.floor(Math.random() * 20) + 10;
    const newMonsterHealth = currentMonster.health - playerDamage;

    // Монстр наносит урон игроку
    const monsterDamage = Math.floor(Math.random() * currentMonster.power);
    const newPlayerHealth = playerHealth - monsterDamage;

    toast({
      title: "Битва!",
      description: `Вы нанесли ${playerDamage} урона! Монстр нанес ${monsterDamage} урона!`
    });

    if (newMonsterHealth <= 0) {
      // Монстр побежден
      updateBalance(balance + currentMonster.reward);
      toast({
        title: "Победа!",
        description: `Вы получили ${currentMonster.reward} монет!`
      });
      setLevel(prev => prev + 1);
      setCurrentMonster(null);
      return;
    }

    if (newPlayerHealth <= 0) {
      // Игрок побежден
      toast({
        title: "Поражение!",
        description: "Вы проиграли битву...",
        variant: "destructive"
      });
      setPlayerHealth(0);
      setCurrentMonster(null);
      setLevel(1);
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

    updateBalance(balance - 50);
    setPlayerHealth(100);
    toast({
      title: "Здоровье восстановлено",
      description: "Ваш герой готов к новым приключениям!"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-game-accent">Приключения</h2>
          <p className="text-sm text-gray-400">Уровень: {level}</p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={restoreHealth}
            disabled={playerHealth >= 100}
          >
            Восстановить здоровье (50 монет)
          </Button>
          <Button onClick={startAdventure} disabled={!!currentMonster || playerHealth <= 0}>
            {playerHealth <= 0 ? "Герой обессилен" : "Начать приключение"}
          </Button>
        </div>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
        <div
          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${(playerHealth / 100) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentMonster && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 bg-game-surface border-game-accent">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-game-accent">{currentMonster.name}</h3>
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    <span>{currentMonster.reward}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Сила: {currentMonster.power}</span>
                    <span>HP: {currentMonster.health}/{currentMonster.maxHealth}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${(currentMonster.health / currentMonster.maxHealth) * 100}%` }}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={attackMonster}
                  disabled={playerHealth <= 0}
                >
                  <Sword className="w-4 h-4 mr-2" />
                  Атаковать
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};