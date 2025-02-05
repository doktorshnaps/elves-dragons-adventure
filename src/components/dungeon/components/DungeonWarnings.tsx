import React from 'react';

interface DungeonWarningsProps {
  isHealthTooLow: boolean;
  hasActiveCards: boolean;
  activeDungeon: string | null;
}

export const DungeonWarnings = ({ isHealthTooLow, hasActiveCards, activeDungeon }: DungeonWarningsProps) => {
  if (activeDungeon) return null;

  return (
    <>
      {isHealthTooLow && (
        <p className="text-red-500 mt-4">
          Здоровье слишком низкое для входа в подземелье
        </p>
      )}

      {!hasActiveCards && (
        <p className="text-red-500 mt-4">
          У вас нет активных карт героев или питомцев
        </p>
      )}
    </>
  );
};