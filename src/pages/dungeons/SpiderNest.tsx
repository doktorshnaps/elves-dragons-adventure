import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';

export const SpiderNest = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('spider_nest' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'spider_nest'
    }));
  }, []);

  const battleState = localStorage.getItem('battleState');
  const currentLevel = battleState ? JSON.parse(battleState).currentDungeonLevel : 1;

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png">
      <DungeonHeader level={currentLevel} />
      <Battle />
    </DungeonLayout>
  );
};