import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const SpiderNest = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('spider_nest' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'spider_nest'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};