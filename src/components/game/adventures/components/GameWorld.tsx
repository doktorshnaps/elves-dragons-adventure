
import React, { useState, useEffect } from 'react';
import { Monster } from '../types';
import { PlayerCharacter } from '../game/PlayerCharacter';
import { MonsterSprite } from '../game/MonsterSprite';
import { ProjectileSprite } from '../game/ProjectileSprite';
import { TargetedMonster } from '../game/types/combatTypes';

interface GameWorldProps {
  gameRef: React.RefObject<HTMLDivElement>;
  cameraOffset: number;
  playerPosition: number;
  playerY: number;
  isAttacking: boolean;
  currentHealth: number;
  playerPower: number;
  monsters: Monster[];
  projectiles: any[];
  onSelectTarget: (monster: Monster) => void;
  targetedMonster: TargetedMonster | null;
  armor: number;
  maxArmor: number;
  maxHealth: number;
  level?: number;
  experience?: number;
  requiredExperience?: number;
  balance: number;
}

const backgrounds = [
  "/lovable-uploads/f97dbde4-585c-4a9d-b47a-32fe1cf9392f.png",
  "/lovable-uploads/d9fed790-128c-40f2-b174-66bff52f9028.png",
  "/lovable-uploads/cffdaff4-73e2-4415-82e4-e70ec09780de.png",
  "/lovable-uploads/981732c0-c6c4-41bf-9eff-e1dc31c3e000.png"
];

export const GameWorld = ({
  gameRef,
  cameraOffset,
  playerPosition,
  playerY,
  isAttacking,
  currentHealth,
  playerPower,
  monsters,
  projectiles,
  onSelectTarget,
  targetedMonster,
  armor,
  maxArmor,
  maxHealth,
  level,
  experience,
  requiredExperience,
  balance
}: GameWorldProps) => {
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(0);
  const segmentWidth = 1000; // Width of each background segment

  useEffect(() => {
    // Calculate which background should be shown based on camera offset
    const newIndex = Math.floor((cameraOffset / segmentWidth) % backgrounds.length);
    setCurrentBackgroundIndex(newIndex);
  }, [cameraOffset]);

  // Calculate positions for three backgrounds (previous, current, next)
  const renderBackgrounds = () => {
    return backgrounds.map((_, index) => {
      const position = index * segmentWidth;
      const bgIndex = (currentBackgroundIndex + index) % backgrounds.length;
      
      return (
        <div
          key={`bg-${index}`}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
          style={{
            backgroundImage: `url(${backgrounds[bgIndex]})`,
            left: `${position}px`,
            width: `${segmentWidth}px`,
            height: '100%',
          }}
        />
      );
    });
  };

  return (
    <div 
      ref={gameRef}
      className="absolute inset-0 h-full"
      style={{
        width: '100000px',
        transform: `translateX(-${cameraOffset}px)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      <div className="fixed top-4 right-4 z-50">
        <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
      </div>

      <div className="relative w-full h-full overflow-hidden">
        {renderBackgrounds()}
      </div>

      <div className="absolute bottom-0 w-full h-[50px] bg-game-surface/50" />

      <PlayerCharacter
        position={playerPosition}
        yPosition={playerY}
        isAttacking={isAttacking}
        health={currentHealth}
        power={playerPower}
        armor={armor}
        maxArmor={maxArmor}
        maxHealth={maxHealth}
        level={level}
        experience={experience}
        requiredExperience={requiredExperience}
      />

      {monsters.map(monster => (
        <MonsterSprite
          key={monster.id}
          monster={monster}
          position={monster.position || 400}
          onSelect={onSelectTarget}
          isTargeted={targetedMonster?.id === monster.id}
        />
      ))}

      {projectiles.map(projectile => (
        <ProjectileSprite
          key={projectile.id}
          x={projectile.x}
          y={projectile.y}
        />
      ))}
    </div>
  );
};
