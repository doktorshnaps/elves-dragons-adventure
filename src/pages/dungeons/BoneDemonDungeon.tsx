import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const BoneDemonDungeon = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('bone_dungeon' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'bone_dungeon'
    }));
  }, []);

  return <Battle />;
};