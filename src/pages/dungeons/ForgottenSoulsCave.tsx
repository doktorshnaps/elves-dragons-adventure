import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';

export const ForgottenSoulsCave = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('forgotten_souls' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'forgotten_souls'
    }));
  }, []);

  const battleState = localStorage.getItem('battleState');
  const currentLevel = battleState ? JSON.parse(battleState).currentDungeonLevel : 1;

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/8d43bcc6-f48b-4491-bc7d-28f5d1b7340c.png">
      <DungeonHeader level={currentLevel} />
      <Battle />
    </DungeonLayout>
  );
};