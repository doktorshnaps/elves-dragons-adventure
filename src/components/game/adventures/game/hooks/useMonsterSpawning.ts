
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
    const distanceFromLast = Math.abs(playerPosition - lastGeneratedPosition);
    const SPAWN_INTERVAL = 100; // Spawn every 100 pixels
    const MAX_MONSTERS = 8; // Increased maximum number of monsters
    
    if (distanceFromLast >= SPAWN_INTERVAL && monsters.length < MAX_MONSTERS) {
      let spawnPosition: number;
      
      if (isMovingRight) {
        spawnPosition = playerPosition + 400;
      } else if (isMovingLeft) {
        spawnPosition = playerPosition - 400;
      } else {
        return; // Don't spawn if not moving
      }

      // Check if there's already a monster at this position
      const monsterExists = monsters.some(
        monster => Math.abs(monster.position - spawnPosition) < SPAWN_INTERVAL
      );

      if (!monsterExists) {
        const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
        const newMonster = generateMonster(spawnPosition);
        
        if (newMonster) {
          // Scale monster stats based on level
          newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
          newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
          newMonster.maxHealth = newMonster.health;
          
          setMonsters(prev => [...prev, newMonster]);
          setLastGeneratedPosition(playerPosition);
          console.log(`New monster spawned at position ${spawnPosition}, Level: ${monsterLevel}`);
        }
      }
    }

    // Clean up monsters that are too far from the player
    const CLEANUP_DISTANCE = 1000;
    setMonsters(prev => 
      prev.filter(monster => 
        Math.abs(monster.position - playerPosition) <= CLEANUP_DISTANCE
      )
    );
  }, [playerPosition, isMovingRight, isMovingLeft]);

  return { monsters, setMonsters };
};
