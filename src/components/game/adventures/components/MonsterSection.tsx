import React from 'react';
import { Monster } from '../types';
import { MonsterCard } from '../MonsterCard';

interface MonsterSectionProps {
  currentMonster: Monster | null;
  attackMonster: () => void;
  playerHealth: number;
}

export const MonsterSection = ({ currentMonster, attackMonster, playerHealth }: MonsterSectionProps) => {
  if (!currentMonster) return null;

  return (
    <MonsterCard
      monster={currentMonster}
      onAttack={attackMonster}
      onSelect={() => {}} // Added missing prop
      isSelected={true} // Added missing prop - assuming current monster is always selected
      playerHealth={playerHealth}
    />
  );
};