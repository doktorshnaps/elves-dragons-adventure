import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const ForgottenSoulsCave = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('forgotten_souls' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'forgotten_souls'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/8d43bcc6-f48b-4491-bc7d-28f5d1b7340c.png">
      <Battle />
    </DungeonLayout>
  );
};