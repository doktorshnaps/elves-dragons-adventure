import React from "react";
import { dungeonNames, DungeonType } from "@/constants/dungeons";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface DungeonDisplayProps {
  rolling: boolean;
  selectedDungeon: DungeonType | null;
}

export const DungeonDisplay = ({ rolling, selectedDungeon }: DungeonDisplayProps) => {
  const { language } = useLanguage();
  
  if (!selectedDungeon) {
    return (
      <div className="mb-6 min-h-[60px] flex items-center justify-center">
        <p className="text-white">{t(language, 'dungeonSearch.selectDungeon')}</p>
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