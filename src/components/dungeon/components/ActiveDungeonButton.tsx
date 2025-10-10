import React from 'react';
import { Button } from '@/components/ui/button';
import { DoorOpen } from 'lucide-react';
import { DungeonType, dungeonRoutes } from '@/constants/dungeons';
import { useNavigate } from 'react-router-dom';

interface ActiveDungeonButtonProps {
  activeDungeon: string | null;
}

export const ActiveDungeonButton = ({ activeDungeon }: ActiveDungeonButtonProps) => {
  const navigate = useNavigate();

  const handleReturnToDungeon = () => {
    if (activeDungeon) {
      const route = dungeonRoutes[activeDungeon as DungeonType];
      navigate(route);
    }
  };

  return (
    <Button
      onClick={handleReturnToDungeon}
      variant="menu"
      style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
    >
      <DoorOpen className="mr-2 h-4 w-4" />
      Вернуться в подземелье
    </Button>
  );
};