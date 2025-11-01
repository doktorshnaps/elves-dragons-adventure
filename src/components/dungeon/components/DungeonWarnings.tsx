import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';

interface DungeonWarningsProps {
  isHealthTooLow: boolean;
  hasActiveCards: boolean;
  activeDungeon: string | null;
}

export const DungeonWarnings = ({ isHealthTooLow, hasActiveCards, activeDungeon }: DungeonWarningsProps) => {
  const { language } = useLanguage();
  
  if (activeDungeon) return null;

  return (
    <>
      {isHealthTooLow && (
        <p className="text-red-400 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-2">
          {t(language, 'dungeonSearch.healthTooLow')}
        </p>
      )}

      {!hasActiveCards && (
        <p className="text-red-400 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-2">
          {t(language, 'dungeonSearch.noActiveCards')}
        </p>
      )}
    </>
  );
};