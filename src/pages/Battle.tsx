import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Sword, Shield, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [level, setLevel] = useState(1);
  const [coins, setCoins] = useState(0);
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

  const attackEnemy = (enemyId: number) => {
    setOpponents(prevOpponents => {
      const newOpponents = prevOpponents.map(opponent => {
        if (opponent.id === enemyId) {
          const newHealth = opponent.health - 20;
          
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

      // Если все враги побеждены, переходим на следующий уровень
      if (newOpponents.length === 0) {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        toast({
          title: "Уровень пройден!",
          description: `Вы перешли на уровень ${nextLevel}! Враги стали сильнее!`,
        });

        // Создаем новых врагов с увеличенными характеристиками
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
              <motion.div
                key={`${opponent.id}-${level}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ delay: opponent.id * 0.2 }}
              >
                <Card className="p-6 bg-game-surface border-game-accent hover:border-game-primary transition-colors">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-game-accent">
                      {opponent.name}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-400">Сила: {opponent.power}</p>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${(opponent.health / opponent.maxHealth) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-400">Здоровье: {opponent.health}/{opponent.maxHealth}</p>
                    </div>
                    <Button
                      onClick={() => attackEnemy(opponent.id)}
                      variant="destructive"
                      className="w-full"
                    >
                      <Sword className="w-4 h-4 mr-2" />
                      Атаковать
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Карточка игрока */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="p-6 bg-game-surface border-game-primary">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-game-primary rounded-full">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-game-accent">Ваш герой</h3>
                  <p className="text-gray-400">Уровень {level}</p>
                </div>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                  <Sword className="w-6 h-6 mx-auto mb-2 text-game-accent" />
                  <p className="text-sm text-gray-400">Сила атаки</p>
                  <p className="font-bold text-game-accent">{playerStats.power}</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-game-accent" />
                  <p className="text-sm text-gray-400">Защита</p>
                  <p className="font-bold text-game-accent">{playerStats.defense}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                <div className="w-32 bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(playerStats.health / playerStats.maxHealth) * 100}%` }}
                  ></div>
                </div>
                <span className="text-gray-400">
                  {playerStats.health}/{playerStats.maxHealth}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Индикатор здоровья в правом нижнем углу */}
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