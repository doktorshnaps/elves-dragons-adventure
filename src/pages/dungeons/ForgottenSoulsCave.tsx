import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';
import { DungeonHeader } from '@/components/dungeon/DungeonHeader';
import { useSearchParams } from 'react-router-dom';

export const ForgottenSoulsCave = () => {
  const [searchParams] = useSearchParams();
  const level = parseInt(searchParams.get('level') || '1');

  useEffect(() => {
    const opponents = generateDungeonOpponents('forgotten_souls' as DungeonType, level);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: level,
      selectedDungeon: 'forgotten_souls'
    }));
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/8d43bcc6-f48b-4491-bc7d-28f5d1b7340c.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};