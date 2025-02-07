
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
    
    if (distanceFromLast >= SPAWN_INTERVAL && monsters.length < 5) {
      const spawnPosition = isMovingRight ? 
        playerPosition + 400 : 
        playerPosition - 400;
      
      const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
      const newMonster = generateMonster(spawnPosition);
      
      if (newMonster) {
        // Scale monster stats based on level
        newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
        newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
        newMonster.maxHealth = newMonster.health;
        
        setMonsters(prev => [...prev, newMonster]);
        setLastGeneratedPosition(playerPosition);
        console.log(`New monster spawned at position ${spawnPosition}`);
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster, monsters.length, lastGeneratedPosition]);

  return { monsters, setMonsters };
};
