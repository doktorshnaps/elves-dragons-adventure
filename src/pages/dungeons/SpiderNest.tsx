import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const SpiderNest = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('spider_nest' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'spider_nest'
    }));
  }, []);

  return <Battle />;
};