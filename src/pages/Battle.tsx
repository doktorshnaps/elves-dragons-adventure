import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { OpponentCard } from "@/components/battle/OpponentCard";
import { PlayerCard } from "@/components/battle/PlayerCard";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [playerStats, setPlayerStats] = useState({
    health: 100,
    maxHealth: 100,
    power: 20,
    defense: 10,
  });

  const getScaledStats = (baseValue: number) => {
    return Math.round(baseValue * Math.pow(1.2, level - 1));
  };

  const [opponents, setOpponents] = useState([
    { id: 1, name: "Дракон", power: 5, health: 100 },
    { id: 2, name: "Тролль", power: 3, health: 70 },
    { id: 3, name: "Гоблин", power: 2, health: 50 },
  ].map(opponent => ({
    ...opponent,
    power: getScaledStats(opponent.power),
    health: getScaledStats(opponent.health),
    maxHealth: getScaledStats(opponent.health)
  })));

  useEffect(() => {
    if (!isPlayerTurn && opponents.length > 0) {
      const timer = setTimeout(() => {
        const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
        
        // Расчет урона с учетом защиты
        const initialDamage = randomOpponent.power;
        const remainingDefense = Math.max(0, playerStats.defense - initialDamage);
        const damageToHealth = Math.max(0, initialDamage - playerStats.defense);
        
        setPlayerStats(prev => {
          const newDefense = Math.max(0, prev.defense);
          const newHealth = Math.max(0, prev.health - damageToHealth);
          
          let message = `${randomOpponent.name} атакует!`;
          if (initialDamage <= prev.defense) {
            message += ` Защита поглотила весь урон!`;
          } else {
            message += ` Защита поглотила ${Math.min(initialDamage, prev.defense)} урона.`;
            message += ` Нанесено ${damageToHealth} урона здоровью!`;
          }
          
          toast({
            title: "Враг атакует!",
            description: message,
          });
          
          return {
            ...prev,
            defense: newDefense,
            health: newHealth,
          };
        });

        setIsPlayerTurn(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, opponents, playerStats.defense]);

  useEffect(() => {
    if (playerStats.health <= 0) {
      toast({
        title: "Игра окончена!",
        description: "Ваш герой пал в бою!",
        variant: "destructive",
      });
      navigate("/game");
    }
  }, [playerStats.health, navigate]);

  const attackEnemy = (enemyId: number) => {
    if (!isPlayerTurn) return;

    setOpponents(prevOpponents => {
      const newOpponents = prevOpponents.map(opponent => {
        if (opponent.id === enemyId) {
          const damage = Math.max(0, playerStats.power - opponent.power / 4);
          const newHealth = opponent.health - damage;
          
          toast({
            title: "Атака!",
            description: `Вы нанесли ${damage} урона ${opponent.name}!`,
          });
          
          if (newHealth <= 0) {
            const earnedCoins = Math.floor(Math.random() * 20) + 10;
            setCoins(prev => prev + earnedCoins);
            toast({
              title: "Враг побежден!",
              description: `Вы получили ${earnedCoins} монет!`,
            });
            return null;
          }
          
          return { ...opponent, health: newHealth };
        }
        return opponent;
      }).filter(Boolean);

      if (newOpponents.length === 0) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        toast({
          title: "Уровень пройден!",
          description: `Вы перешли на уровень ${nextLevel}! Враги стали сильнее!`,
        });

        return [
          { id: 1, name: "Дракон", power: 5, health: 100 },
          { id: 2, name: "Тролль", power: 3, health: 70 },
          { id: 3, name: "Гоблин", power: 2, health: 50 },
        ].map(opponent => ({
          ...opponent,
          power: getScaledStats(opponent.power),
          health: getScaledStats(opponent.health),
          maxHealth: getScaledStats(opponent.health)
        }));
      }

      setIsPlayerTurn(false);
      return newOpponents;
    });
  };

  return (
    <div className="min-h-screen bg-game-background p-6 relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={() => navigate("/game")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-game-accent">Битва</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-yellow-500">🪙 {coins}</span>
            <span className="text-xl font-bold text-purple-500">👑 Уровень {level}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-game-accent hover:text-game-accent/80"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnimatePresence>
            {opponents.map((opponent) => (
              <OpponentCard
                key={opponent.id}
                opponent={opponent}
                onAttack={attackEnemy}
                isPlayerTurn={isPlayerTurn}
              />
            ))}
          </AnimatePresence>
        </div>

        <PlayerCard playerStats={playerStats} level={level} />
      </motion.div>

      <div className="fixed bottom-6 right-6 bg-game-surface p-4 rounded-lg border border-game-accent shadow-lg">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          <span className="font-bold text-xl text-game-accent">
            {playerStats.health}/{playerStats.maxHealth}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Battle;