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
        <p className="text-red-400 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-2">
          Здоровье слишком низкое для входа в подземелье
        </p>
      )}

      {!hasActiveCards && (
        <p className="text-red-400 mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-2">
          У вас нет активных карт героев или питомцев
        </p>
      )}
    </>
  );
};