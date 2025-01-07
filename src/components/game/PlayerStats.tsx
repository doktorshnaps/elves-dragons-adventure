import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Shield, Sword, Star, Timer } from "lucide-react";
import { PlayerStats } from "@/types/battle";
import { EquipmentTab } from "./EquipmentTab";
import { Equipment } from "@/types/equipment";

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

  const [timeUntilRegen, setTimeUntilRegen] = useState<number>(HEALTH_REGEN_INTERVAL);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(currentStats => {
        if (currentStats.health === 0) {
          const newHealth = Math.min(currentStats.health + HEALTH_REGEN_AMOUNT, currentStats.maxHealth);
          const newStats = { ...currentStats, health: newHealth };
          
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

    const timerInterval = setInterval(() => {
      setTimeUntilRegen(prev => {
        if (prev <= 0) {
          return HEALTH_REGEN_INTERVAL;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setStats(state.playerStats);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const checkInterval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  const healthPercentage = (stats.health / stats.maxHealth) * 100;
  const experiencePercentage = (stats.experience / stats.requiredExperience) * 100;

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEquip = (item: Equipment) => {
    // Здесь будет логика экипировки предметов
  };

  const handleUnequip = (slot: string) => {
    // Здесь будет логика снятия предметов
  };

  return (
    <Tabs defaultValue="stats" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="stats">Характеристики</TabsTrigger>
        <TabsTrigger value="equipment">Экипировка</TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <Card className="p-6 bg-game-surface border-game-accent">
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
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-game-accent" />
              <span className="text-sm text-game-accent">
                Восстановление через: {formatTime(timeUntilRegen)}
              </span>
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
      </TabsContent>

      <TabsContent value="equipment">
        <EquipmentTab 
          onEquip={handleEquip}
          onUnequip={handleUnequip}
        />
      </TabsContent>
    </Tabs>
  );
};
