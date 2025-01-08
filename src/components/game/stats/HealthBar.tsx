import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HEALTH_REGEN_INTERVAL = 5 * 60 * 1000; // 5 минут
const HEALTH_REGEN_AMOUNT = 10;

interface HealthBarProps {
  health: number;
  maxHealth: number;
}

export const HealthBar = ({ health, maxHealth }: HealthBarProps) => {
  const { toast } = useToast();
  const [timeUntilRegen, setTimeUntilRegen] = useState<number>(HEALTH_REGEN_INTERVAL);
  const [lastRegenTime, setLastRegenTime] = useState<number>(Date.now());

  useEffect(() => {
    const handleHealthRegen = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.playerStats.health < state.playerStats.maxHealth) {
          state.playerStats.health = Math.min(
            state.playerStats.health + HEALTH_REGEN_AMOUNT,
            state.playerStats.maxHealth
          );
          localStorage.setItem('battleState', JSON.stringify(state));
          toast({
            title: "Восстановление",
            description: `Восстановлено ${HEALTH_REGEN_AMOUNT} HP`,
          });
        }
      }
      setLastRegenTime(Date.now());
    };

    const interval = setInterval(handleHealthRegen, HEALTH_REGEN_INTERVAL);
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

  const healthPercentage = (health / maxHealth) * 100;
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-game-accent">Здоровье</span>
          <span className="text-sm text-game-accent">{health}/{maxHealth}</span>
        </div>
        <Progress value={healthPercentage} className="h-2" />
        {health < maxHealth && (
          <div className="text-xs text-game-accent mt-1">
            Следующее восстановление через: {formatTime(timeUntilRegen)}
          </div>
        )}
      </div>
    </div>
  );
};