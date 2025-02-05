import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const BlackDragonLair = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('dragon_lair' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dragon_lair'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/6fd75ecf-0a85-4a95-8b57-81f649a96e49.png">
      <Battle />
    </DungeonLayout>
  );
};