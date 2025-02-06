import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Heart, Shield, Star } from "lucide-react";

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
    <div className="fixed top-20 left-0 right-0 z-50 bg-game-surface/90 backdrop-blur-sm p-2">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className={`w-5 h-5 ${healthPercentage <= 20 ? 'text-red-500' : 'text-game-accent'}`} />
            <span className="text-sm text-game-accent">{Math.floor(health)}/{maxHealth}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-game-accent">{Math.floor(armor)}/{maxArmor}</span>
          </div>

          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-game-accent">Ур. {level}</span>
          </div>
        </div>

        <div className="space-y-1">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Progress value={healthPercentage} className="h-2 bg-red-900 flex-grow">
              <div 
                className="h-full bg-red-500 transition-all duration-300 rounded-full"
                style={{ width: `${healthPercentage}%` }}
              />
            </Progress>
            <span className="text-xs text-game-accent min-w-[60px] text-right">
              {Math.floor(health)}/{maxHealth}
            </span>
          </div>

          {/* Armor Bar */}
          <div className="flex items-center gap-2">
            <Progress value={armorPercentage} className="h-2 bg-blue-900 flex-grow">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${armorPercentage}%` }}
              />
            </Progress>
            <span className="text-xs text-game-accent min-w-[60px] text-right">
              {Math.floor(armor)}/{maxArmor}
            </span>
          </div>

          {/* Experience Bar */}
          <div className="flex items-center gap-2">
            <Progress value={experiencePercentage} className="h-2 bg-purple-900 flex-grow">
              <div 
                className="h-full bg-purple-500 transition-all duration-300 rounded-full"
                style={{ width: `${experiencePercentage}%` }}
              />
            </Progress>
            <span className="text-xs text-game-accent min-w-[60px] text-right">
              {experience}/{requiredExperience}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};