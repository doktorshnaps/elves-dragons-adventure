import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const BlackDragonLair = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('dragon_lair' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'dragon_lair'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/6fd75ecf-0a85-4a95-8b57-81f649a96e49.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};