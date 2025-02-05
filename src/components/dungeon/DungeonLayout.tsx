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

  const handleReturnToMenu = () => {
    // Сохраняем текущее состояние битвы перед возвратом в меню
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      // Добавляем флаг, что это сохраненное состояние
      state.isSaved = true;
      localStorage.setItem('battleState', JSON.stringify(state));
      
      toast({
        title: "Прогресс сохранен",
        description: "Вы можете вернуться к битве через меню подземелий",
      });
    }
    navigate('/menu');
  };

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
          onClick={handleReturnToMenu}
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