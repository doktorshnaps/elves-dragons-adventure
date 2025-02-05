import { Battle } from '../Battle';
import { useEffect } from 'react';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { DungeonLayout } from '@/components/dungeon/DungeonLayout';

export const BoneDemonDungeon = () => {
  const navigate = useNavigate();

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

  const handleExitDungeon = () => {
    localStorage.removeItem('battleState');
    navigate('/dungeons');
  };

  return (
    <DungeonLayout backgroundImage="/lovable-uploads/eca4bec7-0f8c-4739-9ddf-9b385800db15.png">
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
          onClick={handleExitDungeon}
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