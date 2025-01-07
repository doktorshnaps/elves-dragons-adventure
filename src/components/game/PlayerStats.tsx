import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Sword, Star } from "lucide-react";
import { PlayerStats } from "@/types/battle";

const HEALTH_REGEN_INTERVAL = 5 * 60 * 1000; // 5 минут
const HEALTH_REGEN_AMOUNT = 10;

export const PlayerStatsCard = () => {
  const [stats, setStats] = useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      return JSON.parse(savedState).playerStats;
    }
    return {
      health: 100,
      maxHealth: 100,
      power: 20,
      defense: 10,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(currentStats => {
        if (currentStats.health === 0) {
          const newHealth = Math.min(currentStats.health + HEALTH_REGEN_AMOUNT, currentStats.maxHealth);
          const newStats = { ...currentStats, health: newHealth };
          
          // Обновляем состояние в localStorage
          const savedState = localStorage.getItem('battleState');
          if (savedState) {
            const state = JSON.parse(savedState);
            state.playerStats = newStats;
            localStorage.setItem('battleState', JSON.stringify(state));
          }
          
          return newStats;
        }
        return currentStats;
      });
    }, HEALTH_REGEN_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Обновляем статистику при изменении в localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setStats(state.playerStats);
      }
    };

    // Добавляем слушатель для событий storage
    window.addEventListener('storage', handleStorageChange);
    
    // Добавляем интервал для регулярной проверки localStorage
    const checkInterval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  const healthPercentage = (stats.health / stats.maxHealth) * 100;
  const experiencePercentage = (stats.experience / stats.requiredExperience) * 100;

  return (
    <Card className="p-6 bg-game-surface border-game-accent mb-6">
      <h2 className="text-xl font-bold text-game-accent mb-4">Статистика персонажа</h2>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-game-accent">Здоровье</span>
              <span className="text-sm text-game-accent">{stats.health}/{stats.maxHealth}</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-game-accent">Опыт</span>
              <span className="text-sm text-game-accent">
                {stats.experience}/{stats.requiredExperience}
              </span>
            </div>
            <Progress value={experiencePercentage} className="h-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-game-accent" />
            <span className="text-sm text-game-accent">Сила: {stats.power}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-game-accent" />
            <span className="text-sm text-game-accent">Защита: {stats.defense}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};