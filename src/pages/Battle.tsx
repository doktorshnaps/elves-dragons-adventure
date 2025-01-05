import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Sword } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Battle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [opponents, setOpponents] = useState([
    { id: 1, name: "Дракон", power: 5, health: 100 },
    { id: 2, name: "Тролль", power: 3, health: 70 },
    { id: 3, name: "Гоблин", power: 2, health: 50 },
  ]);
  const [coins, setCoins] = useState(0);

  const attackEnemy = (enemyId: number) => {
    setOpponents(prevOpponents => {
      return prevOpponents.map(opponent => {
        if (opponent.id === enemyId) {
          const newHealth = opponent.health - 20; // Базовый урон от атаки
          
          if (newHealth <= 0) {
            // Враг побежден
            const earnedCoins = Math.floor(Math.random() * 20) + 10; // 10-30 монет
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
    });
  };

  return (
    <div className="min-h-screen bg-game-background p-6">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatePresence>
            {opponents.map((opponent) => (
              <motion.div
                key={opponent.id}
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
                          style={{ width: `${(opponent.health / 100) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-gray-400">Здоровье: {opponent.health}</p>
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
      </motion.div>
    </div>
  );
};

export default Battle;