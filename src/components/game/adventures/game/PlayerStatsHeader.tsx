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
  return (
    <div className="fixed top-20 right-4 z-50 bg-game-surface/90 backdrop-blur-sm p-2 rounded-lg">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span className="text-sm text-game-accent">Ур. {level}</span>
        </div>
      </div>
    </div>
  );
};