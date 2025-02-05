import React from 'react';
import { Button } from '@/components/ui/button';
import { DungeonType } from '@/constants/dungeons';

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
  return (
    <>
      {!selectedDungeon && (
        <Button
          onClick={onRollDice}
          disabled={rolling || energyState.current <= 0 || isHealthTooLow || !hasActiveCards}
          className="bg-game-primary hover:bg-game-primary/80"
        >
          {rolling ? "Поиск подземелья..." : "Искать подземелье"}
        </Button>
      )}
      
      {selectedDungeon && !rolling && (
        <Button
          onClick={handleDungeonSelect}
          className="bg-game-accent hover:bg-game-accent/80"
        >
          Войти в подземелье
        </Button>
      )}
    </>
  );
};