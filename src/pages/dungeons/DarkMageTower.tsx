import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const DarkMageTower = () => {
  const navigate = useNavigate();

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