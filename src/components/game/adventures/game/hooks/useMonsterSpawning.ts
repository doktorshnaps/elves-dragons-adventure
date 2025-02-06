import { useEffect, useRef } from 'react';
import { Monster } from '../../types';
import { useMonsterGeneration } from '../../useMonsterGeneration';

export const useMonsterSpawning = (
  isMovingRight: boolean,
  isMovingLeft: boolean,
  playerPosition: number,
  setMonsters: React.Dispatch<React.SetStateAction<Monster[]>>,
  monsters: Monster[]
) => {
  const { generateMonster } = useMonsterGeneration(1);
  const lastMonsterSpawn = useRef(0);

  useEffect(() => {
    const currentTime = Date.now();
    if (currentTime - lastMonsterSpawn.current > 2000) {
      const spawnDistance = isMovingRight ? playerPosition + 400 : playerPosition - 400;
      
      const monsterExists = monsters.some(monster => 
        Math.abs(monster.position! - spawnDistance) < 200
      );
      
      if (!monsterExists && ((isMovingRight && spawnDistance > playerPosition) || 
          (isMovingLeft && spawnDistance < playerPosition))) {
        const monsterLevel = Math.floor(Math.abs(playerPosition) / 1000) + 1;
        const newMonster = generateMonster(spawnDistance);
        
        if (newMonster) {
          newMonster.power = Math.floor(newMonster.power * (1 + monsterLevel * 0.2));
          newMonster.health = Math.floor(newMonster.health * (1 + monsterLevel * 0.2));
          newMonster.maxHealth = newMonster.health;
          
          setMonsters(prev => [...prev, newMonster]);
          lastMonsterSpawn.current = currentTime;
        }
      }
    }
  }, [playerPosition, isMovingRight, isMovingLeft, generateMonster, monsters, setMonsters]);
};