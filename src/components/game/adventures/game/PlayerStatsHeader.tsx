import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Heart, Shield } from "lucide-react";

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
  const healthPercentage = (health / maxHealth) * 100;
  const armorPercentage = (armor / maxArmor) * 100;
  const experiencePercentage = (experience / requiredExperience) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-game-surface/90 backdrop-blur-sm p-2">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
            <span className="text-sm text-game-accent">{health}/{maxHealth}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-game-accent">{armor}/{maxArmor}</span>
          </div>
        </div>

        <div className="space-y-1">
          {/* Health Bar */}
          <Progress value={healthPercentage} className="h-2 bg-red-900">
            <div 
              className="h-full bg-red-500 transition-all duration-300 rounded-full"
              style={{ width: `${healthPercentage}%` }}
            />
          </Progress>

          {/* Armor Bar */}
          <Progress value={armorPercentage} className="h-2 bg-blue-900">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${armorPercentage}%` }}
            />
          </Progress>

          {/* Experience Bar */}
          <Progress value={experiencePercentage} className="h-2 bg-purple-900">
            <div 
              className="h-full bg-purple-500 transition-all duration-300 rounded-full"
              style={{ width: `${experiencePercentage}%` }}
            />
          </Progress>
        </div>
      </div>
    </div>
  );
};