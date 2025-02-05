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
    // Проверяем, есть ли сохраненное состояние
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      // Если это не сохраненное состояние или другое подземелье, генерируем новое
      if (!state.isSaved || state.selectedDungeon !== 'spider_nest') {
        const opponents = generateDungeonOpponents('spider_nest' as DungeonType, level);
        localStorage.setItem('battleState', JSON.stringify({
          opponents,
          currentDungeonLevel: level,
          selectedDungeon: 'spider_nest'
        }));
      }
    } else {
      // Если нет сохраненного состояния, генерируем новое
      const opponents = generateDungeonOpponents('spider_nest' as DungeonType, level);
      localStorage.setItem('battleState', JSON.stringify({
        opponents,
        currentDungeonLevel: level,
        selectedDungeon: 'spider_nest'
      }));
    }
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};