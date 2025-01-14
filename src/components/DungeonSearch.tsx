import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { getInitialEnergyState, useEnergy, getTimeUntilNextEnergy, EnergyState } from "@/utils/energyManager";
import { dungeonBackgrounds, dungeons } from "@/constants/dungeons";
import { EnergyDisplay } from "./dungeon/EnergyDisplay";
import { DungeonDisplay } from "./dungeon/DungeonDisplay";

interface DungeonSearchProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const DungeonSearch = ({ onClose, balance }: DungeonSearchProps) => {
  const [rolling, setRolling] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState<string | null>(null);
  const [energyState, setEnergyState] = useState<EnergyState>(getInitialEnergyState());
  const [timeUntilNext, setTimeUntilNext] = useState(getTimeUntilNextEnergy());
  const [playerHealth, setPlayerHealth] = useState<{ current: number; max: number }>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return {
        current: state.playerStats.health,
        max: state.playerStats.maxHealth
      };
    }
    return { current: 100, max: 100 };
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const interval = setInterval(() => {
      const newEnergyState = getInitialEnergyState();
      setEnergyState(newEnergyState);
      setTimeUntilNext(getTimeUntilNextEnergy());

      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setPlayerHealth({
          current: state.playerStats.health,
          max: state.playerStats.maxHealth
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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

    if (!useEnergy()) {
      toast({
        title: "Недостаточно энергии",
        description: "Подождите пока энергия восстановится",
        variant: "destructive",
      });
      return;
    }

    if (playerHealth.current < playerHealth.max * 0.2) {
      toast({
        title: "Низкое здоровье",
        description: "Подождите пока здоровье восстановится до 20% от максимума",
        variant: "destructive",
      });
      return;
    }

    setRolling(true);
    
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

  const isHealthTooLow = playerHealth.current < playerHealth.max * 0.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
    >
      <Card 
        className="bg-game-surface border-game-accent p-8 max-w-md w-full relative overflow-hidden"
        style={{
          backgroundImage: selectedDungeon ? `url("${dungeonBackgrounds[selectedDungeon]}")` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div className="relative z-10">
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
            
            <EnergyDisplay energyState={energyState} timeUntilNext={timeUntilNext} />
            
            <div className="mb-4">
              <p className="text-game-accent">Баланс: {balance} монет</p>
            </div>
            
            <DungeonDisplay rolling={rolling} selectedDungeon={selectedDungeon} />

            <div className="space-x-4">
              <Button
                onClick={rollDice}
                disabled={rolling || energyState.current <= 0 || isHealthTooLow}
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
            
            {isHealthTooLow && (
              <p className="text-red-500 mt-4">
                Здоровье слишком низкое для входа в подземелье
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};