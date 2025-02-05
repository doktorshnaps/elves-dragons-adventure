import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';

export const SeaSerpentLair = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('sea_serpent' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'sea_serpent'
    }));
  }, []);

  const battleState = localStorage.getItem('battleState');
  const currentLevel = battleState ? JSON.parse(battleState).currentDungeonLevel : 1;

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/a143d5f9-fa7c-479a-8103-304e3be6dae0.png">
      <DungeonHeader level={currentLevel} />
      <Battle />
    </DungeonLayout>
  );
};