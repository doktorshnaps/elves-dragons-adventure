import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';

export const ForgottenSoulsCave = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('forgotten_souls' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'forgotten_souls'
    }));
  }, []);

  return <Battle />;
};