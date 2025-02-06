import React from 'react';
import { Monster } from '../types';
import { MonsterSprite } from './MonsterSprite';
import { PlayerCharacter } from './PlayerCharacter';

interface GameWorldProps {
  gameRef: React.RefObject<HTMLDivElement>;
  cameraOffset: number;
  playerPosition: number;
  playerY: number;
  currentHealth: number;
  playerPower: number;
  monsters: Monster[];
  selectedMonsterId?: number;
  onMonsterSelect: (monster: Monster) => void;
}

export const GameWorld = ({
  gameRef,
  cameraOffset,
  playerPosition,
  playerY,
  currentHealth,
  playerPower,
  monsters,
  selectedMonsterId,
  onMonsterSelect
}: GameWorldProps) => {
  return (
    <div
      ref={gameRef}
      className="w-full h-full relative"
      style={{
        transform: `translateX(-${cameraOffset}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Фон и земля */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900 to-blue-700" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-800" />

      {/* Монстры */}
      {monsters.map(monster => (
        <div
          key={monster.id}
          onClick={() => onMonsterSelect(monster)}
          className="cursor-pointer"
        >
          <MonsterSprite
            monster={monster}
            position={monster.position || 0}
          />
        </div>
      ))}

      {/* Игрок */}
      <PlayerCharacter
        position={playerPosition}
        yPosition={playerY}
        isAttacking={false}
        health={currentHealth}
        power={playerPower}
      />
    </div>
  );
};