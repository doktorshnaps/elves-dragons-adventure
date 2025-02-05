import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';

export const IcyThrone = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('ice_throne' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'ice_throne'
    }));
  }, []);

  const battleState = localStorage.getItem('battleState');
  const currentLevel = battleState ? JSON.parse(battleState).currentDungeonLevel : 1;

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/7989b19f-08e4-4851-b2ac-38883ea5331f.png">
      <DungeonHeader level={currentLevel} />
      <Battle />
    </DungeonLayout>
  );
};