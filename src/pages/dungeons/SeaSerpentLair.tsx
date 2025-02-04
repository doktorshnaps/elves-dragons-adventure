import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const SeaSerpentLair = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const opponents = generateDungeonOpponents('sea_serpent' as DungeonType, 1);
    localStorage.setItem('battleState', JSON.stringify({
      opponents,
      currentDungeonLevel: 1,
      selectedDungeon: 'sea_serpent'
    }));
  }, []);

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/a143d5f9-fa7c-479a-8103-304e3be6dae0.png">
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