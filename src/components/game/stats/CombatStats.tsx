import React from "react";
import { Sword, Shield } from "lucide-react";

interface CombatStatsProps {
  power: number;
  defense: number;
  currentDefense?: number;
  maxDefense?: number;
}

export const CombatStats = ({ power, defense, currentDefense, maxDefense }: CombatStatsProps) => {
  const displayDefense = currentDefense !== undefined ? currentDefense : defense;
  const displayMaxDefense = maxDefense !== undefined ? maxDefense : defense;
  const showDefenseBar = currentDefense !== undefined && maxDefense !== undefined;
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <Sword className="w-5 h-5 text-game-accent" />
        <span className="text-sm text-game-accent">Сила: {power}</span>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-game-accent" />
          <span className="text-sm text-game-accent">
            Броня: {displayDefense}{showDefenseBar && ` / ${displayMaxDefense}`}
          </span>
        </div>
        {showDefenseBar && displayMaxDefense > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(displayDefense / displayMaxDefense) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};