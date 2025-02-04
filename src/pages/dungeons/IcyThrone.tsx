import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const IcyThrone = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('ice_throne' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'ice_throne'
    }));
  }, []);

  return <Battle />;
};