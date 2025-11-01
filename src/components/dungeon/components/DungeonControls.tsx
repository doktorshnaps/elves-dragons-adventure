import React from 'react';
import { Button } from '@/components/ui/button';
import { DungeonType } from '@/constants/dungeons';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';

interface DungeonControlsProps {
  selectedDungeon: DungeonType | null;
  rolling: boolean;
  energyState: { current: number };
  isHealthTooLow: boolean;
  hasActiveCards: boolean;
  onRollDice: () => void;
  handleDungeonSelect: () => void;
}

export const DungeonControls = ({
  selectedDungeon,
  rolling,
  energyState,
  isHealthTooLow,
  hasActiveCards,
  onRollDice,
  handleDungeonSelect
}: DungeonControlsProps) => {
  const { language } = useLanguage();
  
  return (
    <>
      {!selectedDungeon && (
        <Button
          onClick={onRollDice}
          disabled={rolling || energyState.current <= 0 || isHealthTooLow || !hasActiveCards}
          variant="menu"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          {rolling ? t(language, 'dungeonSearch.searching') : t(language, 'dungeonSearch.search')}
        </Button>
      )}
      
      {selectedDungeon && !rolling && (
        <Button
          onClick={handleDungeonSelect}
          variant="menu"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          {t(language, 'dungeonSearch.enter')}
        </Button>
      )}
    </>
  );
};