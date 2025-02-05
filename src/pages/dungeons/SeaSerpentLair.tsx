import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const SeaSerpentLair = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('sea_serpent' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'sea_serpent'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/a143d5f9-fa7c-479a-8103-304e3be6dae0.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};