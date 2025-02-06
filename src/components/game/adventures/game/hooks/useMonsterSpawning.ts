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

  useEffect(() => {
    const distanceFromLast = Math.abs(playerPosition - lastGeneratedPosition);
    
    if (distanceFromLast >= 200) {
      const spawnPosition = isMovingRight ? 
        playerPosition + 400 : 
        playerPosition - 400;
      
      const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
      const newMonster = generateMonster(spawnPosition);
      
      if (newMonster) {
        newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
        newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
        newMonster.maxHealth = newMonster.health;
        
        setMonsters(prev => [...prev, newMonster]);
        setLastGeneratedPosition(playerPosition);
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster, lastGeneratedPosition]);

  return { monsters, setMonsters };
};