import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const DarkMageTower = () => {
  useEffect(() => {
    const opponents = generateDungeonOpponents('dark_mage' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dark_mage'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/dfd50626-40bd-4733-86b9-c07888a2bb9a.png">
      <Battle />
    </DungeonLayout>
  );
};