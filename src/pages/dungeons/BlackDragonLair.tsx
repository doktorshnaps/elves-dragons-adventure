import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const BlackDragonLair = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const opponents = generateDungeonOpponents('dragon_lair' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'dragon_lair'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/6fd75ecf-0a85-4a95-8b57-81f649a96e49.png">
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