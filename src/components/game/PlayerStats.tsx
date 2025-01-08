import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Sword, Star } from "lucide-react";
import { PlayerStats } from "@/types/battle";
import { useToast } from "@/hooks/use-toast";

const HEALTH_REGEN_INTERVAL = 5 * 60 * 1000; // 5 минут
const HEALTH_REGEN_AMOUNT = 10; // Количество восстанавливаемого здоровья
const INITIAL_HEALTH_AFTER_DEATH = 10; // Начальное здоровье после смерти

export const PlayerStatsCard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Проверяем, не умер ли персонаж
      if (parsedState.playerStats.health <= 0) {
        parsedState.playerStats.health = INITIAL_HEALTH_AFTER_DEATH;
        localStorage.setItem('battleState', JSON.stringify(parsedState));
      }
      return parsedState.playerStats;
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

  const [timeUntilRegen, setTimeUntilRegen] = useState<number>(HEALTH_REGEN_INTERVAL);
  const [lastRegenTime, setLastRegenTime] = useState<number>(Date.now());

  useEffect(() => {
    const handleHealthRegen = () => {
      setStats(currentStats => {
        // Если здоровье меньше максимального, восстанавливаем
        if (currentStats.health < currentStats.maxHealth) {
          const newHealth = Math.min(currentStats.health + HEALTH_REGEN_AMOUNT, currentStats.maxHealth);
          const newStats = { ...currentStats, health: newHealth };
          
          // Обновляем состояние в localStorage
          const savedState = localStorage.getItem('battleState');
          if (savedState) {
            const state = JSON.parse(savedState);
            state.playerStats = newStats;
            localStorage.setItem('battleState', JSON.stringify(state));
          }

          toast({
            title: "Восстановление",
            description: `Восстановлено ${HEALTH_REGEN_AMOUNT} HP`,
          });
          
          return newStats;
        }
        return currentStats;
      });
      setLastRegenTime(Date.now());
    };

    const interval = setInterval(handleHealthRegen, HEALTH_REGEN_INTERVAL);

    // Обновляем таймер каждую секунду
    const timerInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRegen = now - lastRegenTime;
      const remainingTime = Math.max(0, HEALTH_REGEN_INTERVAL - timeSinceLastRegen);
      setTimeUntilRegen(remainingTime);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [lastRegenTime, toast]);

  // Обновляем статистику при изменении в localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Проверяем, не умер ли персонаж
        if (state.playerStats.health <= 0) {
          state.playerStats.health = INITIAL_HEALTH_AFTER_DEATH;
          localStorage.setItem('battleState', JSON.stringify(state));
          toast({
            title: "Восстановление после смерти",
            description: `Здоровье восстановлено до ${INITIAL_HEALTH_AFTER_DEATH} HP`,
          });
        }
        setStats(state.playerStats);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const checkInterval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [toast]);

  const healthPercentage = (stats.health / stats.maxHealth) * 100;
  const experiencePercentage = (stats.experience / stats.requiredExperience) * 100;

  // Форматируем время для отображения
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-game-surface border-game-accent mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-game-accent">Статистика персонажа</h2>
        <span className="text-lg font-semibold text-game-accent">Уровень {stats.level}</span>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-game-accent">Здоровье</span>
              <span className="text-sm text-game-accent">{stats.health}/{stats.maxHealth}</span>
            </div>
            <Progress value={healthPercentage} className="h-2" />
            {stats.health < stats.maxHealth && (
              <div className="text-xs text-game-accent mt-1">
                Следующее восстановление через: {formatTime(timeUntilRegen)}
              </div>
            )}
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