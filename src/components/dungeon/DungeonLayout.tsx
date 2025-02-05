import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DungeonLayoutProps {
  children: React.ReactNode;
  backgroundImage: string;
}

export const DungeonLayout = ({ children, backgroundImage }: DungeonLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLeaveDungeon = () => {
    localStorage.removeItem('battleState');
    navigate('/dungeons');
    toast({
      title: "Подземелье покинуто",
      description: "Весь прогресс сброшен",
      variant: "destructive",
    });
  };

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div className="fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          onClick={() => navigate('/menu')}
          className="bg-game-surface/80 hover:bg-game-surface/90 text-game-primary border-game-primary/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться в меню
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="outline" 
          onClick={handleLeaveDungeon}
          className="bg-game-surface/80 hover:bg-game-surface/90 text-game-primary border-game-primary/20"
        >
          <DoorOpen className="mr-2 h-4 w-4" />
          Покинуть подземелье
        </Button>
      </div>

      <div className="relative z-10 pt-20">
        {children}
      </div>
    </div>
  );
};