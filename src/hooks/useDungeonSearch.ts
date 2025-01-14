import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { getInitialEnergyState, useEnergy, getTimeUntilNextEnergy, EnergyState } from "@/utils/energyManager";
import { dungeons } from "@/constants/dungeons";

export const useDungeonSearch = (balance: number) => {
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

      const battleState = {
        playerStats: {
          health: playerHealth.current,
          maxHealth: playerHealth.max,
          power: 10,
          defense: 5,
          experience: 0,
          level: 1,
          requiredExperience: 100
        },
        selectedDungeon: finalDungeon,
        currentDungeonLevel: 1,
        opponents: [],
        inventory: [],
        coins: balance
      };
      
      localStorage.removeItem('battleState');
      localStorage.setItem('battleState', JSON.stringify(battleState));
      
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

  return {
    rolling,
    selectedDungeon,
    energyState,
    timeUntilNext,
    isHealthTooLow,
    rollDice
  };
};