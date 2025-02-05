import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const BoneDemonDungeon = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('bone_dungeon' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'bone_dungeon'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/eca4bec7-0f8c-4739-9ddf-9b385800db15.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};