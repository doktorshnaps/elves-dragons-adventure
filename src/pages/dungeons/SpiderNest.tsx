import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const SpiderNest = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const opponents = generateDungeonOpponents('spider_nest' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'spider_nest'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/76e1f373-c075-4b97-9cde-84e2869f0f4d.png">
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => navigate('/menu')}
          className="bg-game-surface/80"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          В меню
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate('/dungeons')}
          className="bg-game-surface/80"
        >
          <DoorOpen className="mr-2 h-4 w-4" />
          Покинуть подземелье
        </Button>
      </div>
      <Battle />
    </DungeonLayout>
  );
};