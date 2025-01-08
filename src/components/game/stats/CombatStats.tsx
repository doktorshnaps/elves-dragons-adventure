import React from "react";
import { Sword, Shield } from "lucide-react";

interface CombatStatsProps {
  power: number;
  defense: number;
}

export const CombatStats = ({ power, defense }: CombatStatsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-center gap-2">
        <Sword className="w-5 h-5 text-game-accent" />
        <span className="text-sm text-game-accent">Сила: {power}</span>
      </div>
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-game-accent" />
        <span className="text-sm text-game-accent">Защита: {defense}</span>
      </div>
    </div>
  );
};