import React from "react";
import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

interface HealthBarProps {
  health: number;
  maxHealth: number;
}

export const HealthBar = ({ health, maxHealth }: HealthBarProps) => {
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div className="flex items-center gap-2">
      <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-game-accent">Здоровье</span>
          <span className="text-sm text-game-accent">{health}/{maxHealth}</span>
        </div>
        <Progress value={healthPercentage} className="h-2" />
      </div>
    </div>
  );
};