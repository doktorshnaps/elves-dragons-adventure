import React from "react";
import { DungeonType } from "@/constants/dungeons";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

const getDungeonName = (dungeon: DungeonType, lang: string) => {
  const keys: Record<DungeonType, string> = {
    spider_nest: 'dungeonSearch.spiderNest',
    bone_dungeon: 'dungeonSearch.boneDungeon',
    dark_mage: 'dungeonSearch.darkMage',
    forgotten_souls: 'dungeonSearch.forgottenSouls',
    ice_throne: 'dungeonSearch.iceThrone',
    sea_serpent: 'dungeonSearch.seaSerpent',
    dragon_lair: 'dungeonSearch.dragonLair',
    pantheon_gods: 'dungeonSearch.pantheonGods'
  };
  return t(lang as any, keys[dungeon]);
};

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
        {getDungeonName(selectedDungeon, language)}
      </h3>
    </div>
  );
};