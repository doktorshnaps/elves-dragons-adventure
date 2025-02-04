import React from 'react';
import { Heart } from "lucide-react";

interface HealthDisplayProps {
  health: number;
  maxHealth: number;
}

export const HealthDisplay = ({ health, maxHealth }: HealthDisplayProps) => {
  return (
    <div className="fixed bottom-2 md:bottom-6 right-2 md:right-6 bg-game-surface p-2 md:p-4 rounded-lg border border-game-accent shadow-lg">
      <div className="flex items-center gap-1 md:gap-2">
        <Heart className="w-4 h-4 md:w-6 md:h-6 text-red-500" />
        <span className="font-bold text-base md:text-xl text-game-accent">
          {health}/{maxHealth}
        </span>
      </div>
    </div>
  );
};