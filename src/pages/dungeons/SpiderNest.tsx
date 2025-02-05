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
    const savedState = localStorage.getItem('battleState');
    
    if (!savedState) {
      // Если нет сохраненного состояния, создаем новое
      const opponents = generateDungeonOpponents('spider_nest' as DungeonType, level);
      const newState = {
        opponents,
        currentDungeonLevel: level,
        selectedDungeon: 'spider_nest',
        isSaved: true
      };
      localStorage.setItem('battleState', JSON.stringify(newState));
    } else {
      const state = JSON.parse(savedState);
      // Проверяем, относится ли сохранение к текущему подземелью
      if (state.selectedDungeon !== 'spider_nest') {
        // Если это другое подземелье, создаем новое состояние
        const opponents = generateDungeonOpponents('spider_nest' as DungeonType, level);
        const newState = {
          opponents,
          currentDungeonLevel: level,
          selectedDungeon: 'spider_nest',
          isSaved: true
        };
        localStorage.setItem('battleState', JSON.stringify(newState));
      }
      // Если это то же подземелье, оставляем существующее состояние
    }
  }, [level]);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png">
      <DungeonHeader level={level} />
      <Battle />
    </DungeonLayout>
  );
};