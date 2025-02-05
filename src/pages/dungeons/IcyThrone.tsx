import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const IcyThrone = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('ice_throne' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'ice_throne'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/7989b19f-08e4-4851-b2ac-38883ea5331f.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};