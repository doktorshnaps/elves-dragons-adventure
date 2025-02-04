import React from 'react';
import { Opponent } from "@/types/battle";
import { OpponentCard } from "../OpponentCard";

interface OpponentsListProps {
  opponents: Opponent[];
  onAttack: (id: number) => void;
  isPlayerTurn: boolean;
  currentLevel: number;
  playerHealth: number;
}

export const OpponentsList = ({
  opponents,
  onAttack,
  isPlayerTurn,
  currentLevel,
  playerHealth
}: OpponentsListProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
      {opponents.map((opponent) => (
        <OpponentCard
          key={opponent.id}
          opponent={opponent}
          onAttack={onAttack}
          isPlayerTurn={isPlayerTurn}
          currentLevel={currentLevel}
          playerHealth={playerHealth}
        />
      ))}
    </div>
  );
};