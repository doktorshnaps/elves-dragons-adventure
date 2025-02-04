import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const BlackDragonLair = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('dragon_lair' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dragon_lair'
    }));
  }, []);

  return <Battle />;
};