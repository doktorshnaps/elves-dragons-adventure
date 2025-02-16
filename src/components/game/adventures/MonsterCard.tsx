
import React from 'react';
import { Monster } from './types';

interface MonsterCardProps {
  monster: Monster;
  onAttack: () => void;
  playerHealth: number;
}

export const MonsterCard = ({ monster, onAttack, playerHealth }: MonsterCardProps) => {
  return (
    <div className="p-4 bg-game-surface rounded-lg">
      <div className="text-xl font-bold text-game-accent mb-2">{monster.name}</div>
      <div className="space-y-2 text-sm">
        <div>Здоровье: {monster.health}/{monster.maxHealth}</div>
        <div>Сила: {monster.power}</div>
        <div>Награда: {monster.reward} монет</div>
        <div>Опыт: {monster.experienceReward}</div>
      </div>
      <button
        className="mt-4 w-full px-4 py-2 bg-game-accent text-white rounded hover:bg-game-accent/90 disabled:opacity-50"
        onClick={onAttack}
        disabled={playerHealth <= 0}
      >
        {playerHealth <= 0 ? "Вы мертвы" : "Атаковать"}
      </button>
    </div>
  );
};
