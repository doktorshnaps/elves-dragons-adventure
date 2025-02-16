
import { useState, useEffect } from 'react';
import { Monster } from '../../types';
import { useMonsterGeneration } from '../../useMonsterGeneration';

export const useMonsterSpawning = (
  playerPosition: number,
  isMovingRight: boolean,
  isMovingLeft: boolean
) => {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [lastGeneratedPosition, setLastGeneratedPosition] = useState(0);
  const { generateMonster } = useMonsterGeneration(1);

  // Generate initial monster
  useEffect(() => {
    if (monsters.length === 0) {
      const initialMonster = generateMonster(400);
      if (initialMonster) {
        setMonsters([initialMonster]);
        setLastGeneratedPosition(400);
        console.log("Initial monster spawned at position 400");
      }
    }
  }, []);

  // Generate new monsters as player moves
  useEffect(() => {
    // Spawn new monsters
    const SPAWN_INTERVAL = 400; // Distance between monsters
    const MAX_MONSTERS = 8;
    const MIN_DISTANCE = 200; // Minimum distance between monsters

    const shouldSpawnNewMonster = () => {
      if (monsters.length >= MAX_MONSTERS) return false;
      if (!isMovingRight && !isMovingLeft) return false;

      const distanceFromLast = Math.abs(playerPosition - lastGeneratedPosition);
      return distanceFromLast >= SPAWN_INTERVAL;
    };

    if (shouldSpawnNewMonster()) {
      const spawnPosition = isMovingRight 
        ? playerPosition + SPAWN_INTERVAL 
        : playerPosition - SPAWN_INTERVAL;

      // Check if there's already a monster nearby
      const hasNearbyMonster = monsters.some(monster => 
        Math.abs(monster.position - spawnPosition) < MIN_DISTANCE
      );

      if (!hasNearbyMonster) {
        const monsterLevel = Math.max(1, Math.floor(Math.abs(playerPosition) / 1000) + 1);
        const newMonster = generateMonster(spawnPosition);

        if (newMonster) {
          // Scale monster stats based on level
          const statsMultiplier = 1 + (monsterLevel - 1) * 0.2;
          newMonster.power = Math.floor(newMonster.power * statsMultiplier);
          newMonster.health = Math.floor(newMonster.health * statsMultiplier);
          newMonster.maxHealth = newMonster.health;
          
          setMonsters(prev => [...prev, newMonster]);
          setLastGeneratedPosition(spawnPosition);
          console.log(`New monster spawned at position ${spawnPosition}, Level: ${monsterLevel}`);
        }
      }
    }

    // Clean up monsters that are too far
    const CLEANUP_DISTANCE = 1200;
    setMonsters(prev => 
      prev.filter(monster => 
        Math.abs(monster.position - playerPosition) <= CLEANUP_DISTANCE
      )
    );
  }, [playerPosition, isMovingRight, isMovingLeft, lastGeneratedPosition, monsters]);

  return { monsters, setMonsters };
};
