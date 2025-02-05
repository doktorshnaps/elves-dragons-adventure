import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const BoneDemonDungeon = () => {
  useEffect(() => {
    const battleState = localStorage.getItem('battleState');
    if (!battleState) {
      const opponents = generateDungeonOpponents('bone_dungeon' as DungeonType, 1);
      localStorage.setItem('battleState', JSON.stringify({
        opponents,
        currentDungeonLevel: 1,
        selectedDungeon: 'bone_dungeon'
      }));
    }
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/eca4bec7-0f8c-4739-9ddf-9b385800db15.png">
      <Battle />
    </DungeonLayout>
  );
};