import React from "react";
import { dungeonNames, DungeonType } from "@/constants/dungeons";

interface DungeonDisplayProps {
  rolling: boolean;
  selectedDungeon: DungeonType | null;
}

export const DungeonDisplay = ({ rolling, selectedDungeon }: DungeonDisplayProps) => {
  if (!selectedDungeon) {
    return (
      <div className="mb-6 min-h-[60px] flex items-center justify-center">
        <p className="text-white">Выберите подземелье</p>
      </div>
    );
  }

  return (
    <div className="mb-6 min-h-[60px] flex items-center justify-center">
      <h3 className={`text-xl font-bold text-white ${rolling ? 'animate-pulse' : ''}`}>
        {dungeonNames[selectedDungeon]}
      </h3>
    </div>
  );
};