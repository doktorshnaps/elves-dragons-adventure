import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const DarkMageTower = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('dark_mage' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dark_mage'
    }));
  }, []);

  return <Battle />;
};