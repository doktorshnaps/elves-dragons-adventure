import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dice6, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

const dungeons = [
  "Логово Черного Дракона",
  "Пещеры Забытых Душ",
  "Трон Ледяного Короля",
  "Лабиринт Темного Мага",
  "Гнездо Гигантских Пауков",
  "Темница Костяных Демонов",
  "Логово Морского Змея"
];

export const DungeonSearch = ({ onClose, balance, onBalanceChange }: DungeonSearchProps) => {
  const [rolling, setRolling] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const rollDice = () => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.playerStats.health > 0) {
        toast({
          title: "У вас уже есть активное подземелье",
          description: "Завершите текущее подземелье или погибните, чтобы начать новое",
          variant: "destructive",
        });
        return;
      } else {
        localStorage.removeItem('battleState');
      }
    }

    setRolling(true);
    
    // Анимированный выбор подземелья
    let currentIndex = 0;
    const interval = setInterval(() => {
      setSelectedDungeon(dungeons[currentIndex]);
      currentIndex = (currentIndex + 1) % dungeons.length;
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      const finalDungeon = dungeons[Math.floor(Math.random() * dungeons.length)];
      setSelectedDungeon(finalDungeon);
      setRolling(false);
      
      toast({
        title: "Подземелье найдено!",
        description: `Вы входите в ${finalDungeon}`,
      });

      setTimeout(() => {
        navigate("/battle");
      }, 2000);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
    >
      <Card className="bg-game-surface border-game-accent p-8 max-w-md w-full relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4 text-game-accent hover:text-game-accent/80"
          onClick={onClose}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-game-accent mb-6">Поиск подземелья</h2>
          
          <div className="mb-4">
            <p className="text-game-accent">Баланс: {balance} монет</p>
          </div>
          
          <motion.div
            animate={{ rotate: rolling ? 360 : 0 }}
            transition={{ duration: 1, repeat: rolling ? Infinity : 0 }}
            className="mb-6"
          >
            <Dice6 className="w-20 h-20 mx-auto text-game-accent" />
          </motion.div>

          <AnimatePresence mode="wait">
            {selectedDungeon && (
              <motion.div
                key={selectedDungeon}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <p className="text-xl text-game-accent">
                  {selectedDungeon}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-x-4">
            <Button
              onClick={rollDice}
              disabled={rolling}
              className="bg-game-primary hover:bg-game-primary/80"
            >
              {rolling ? "Поиск подземелья..." : "Искать подземелье"}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-game-accent text-game-accent"
            >
              Закрыть
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};