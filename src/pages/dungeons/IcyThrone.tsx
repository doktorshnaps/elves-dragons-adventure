import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const IcyThrone = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('ice_throne' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'ice_throne'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/7989b19f-08e4-4851-b2ac-38883ea5331f.png">
      <Battle />
    </DungeonLayout>
  );
};