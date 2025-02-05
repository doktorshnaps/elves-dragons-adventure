import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';

export const BlackDragonLair = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('dragon_lair' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dragon_lair'
    }));
  }, []);

  const battleState = localStorage.getItem('battleState');
  const currentLevel = battleState ? JSON.parse(battleState).currentDungeonLevel : 1;

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/6fd75ecf-0a85-4a95-8b57-81f649a96e49.png">
      <DungeonHeader level={currentLevel} />
      <Battle />
    </DungeonLayout>
  );
};