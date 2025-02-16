import React from 'react';
import { Progress } from "@/components/ui/progress";
import { Sword, Shield, Heart, Star } from "lucide-react";

interface PlayerStatsHeaderProps {
  health: number;
  maxHealth: number;
  power: number;
  level: number;
  experience: number;
  requiredExperience: number;
}

export const PlayerStatsHeader = ({
  health,
  maxHealth,
  power,
  level,
  experience,
  requiredExperience
}: PlayerStatsHeaderProps) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-game-surface/90 backdrop-blur-sm p-2">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-game-accent">Уровень: {level}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between text-xs text-game-accent mb-1">
            <span>Опыт: {experience}</span>
            <span>{requiredExperience}</span>
          </div>
          <Progress value={(experience / requiredExperience) * 100} className="h-2" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span className="text-sm text-game-accent">{health}/{maxHealth}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sword className="w-5 h-5 text-game-accent" />
            <span className="text-sm text-game-accent">{power}</span>
          </div>
        </div>
      </div>
    </div>
  );
};