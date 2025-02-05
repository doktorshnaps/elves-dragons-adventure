import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const DarkMageTower = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('dark_mage' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'dark_mage'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/dfd50626-40bd-4733-86b9-c07888a2bb9a.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};