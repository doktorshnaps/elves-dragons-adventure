
import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Star, Shield } from "lucide-react";

interface PlayerStatsHeaderProps {
  health: number;
  maxHealth: number;
  power: number;
  level: number;
  experience: number;
  requiredExperience: number;
  armor: number;
  maxArmor: number;
}

export const PlayerStatsHeader = ({
  health,
  maxHealth,
  power,
  level,
  experience,
  requiredExperience,
  armor,
  maxArmor
}: PlayerStatsHeaderProps) => {
  return (
    <div className="fixed top-20 right-4 z-50 bg-game-surface/90 backdrop-blur-sm p-4 rounded-lg">
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-game-accent">Уровень {level}</span>
        </div>

        <div className="space-y-2">
          {/* Health Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-game-accent">
              <span>Здоровье</span>
              <span>{Math.floor(health)}/{maxHealth}</span>
            </div>
            <Progress value={(health / maxHealth) * 100} className="h-2 bg-red-900" indicatorClassName="bg-red-500" />
          </div>

          {/* Armor Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-game-accent">
              <span>Броня</span>
              <span>{Math.floor(armor)}/{maxArmor}</span>
            </div>
            <Progress value={(armor / maxArmor) * 100} className="h-2 bg-blue-900" indicatorClassName="bg-blue-500" />
          </div>

          {/* Experience Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-game-accent">
              <span>Опыт</span>
              <span>{experience}/{requiredExperience}</span>
            </div>
            <Progress value={(experience / requiredExperience) * 100} className="h-2 bg-purple-900" indicatorClassName="bg-purple-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
