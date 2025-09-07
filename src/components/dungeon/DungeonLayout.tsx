import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';

interface DungeonLayoutProps {
  children: React.ReactNode;
  backgroundImage: string;
}

export const DungeonLayout = ({ children, backgroundImage }: DungeonLayoutProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const { language } = useLanguage();

  const handleReturnToMenu = () => {
    // Сохраняем текущее состояние битвы перед возвратом в меню
    if (gameData.battleState) {
      const state = { ...gameData.battleState, isSaved: true };
      updateGameData({ battleState: state });
      
      toast({
        title: language === 'ru' ? "Прогресс сохранен" : "Progress saved",
        description: t(language, 'items.battleReturnWarning'),
      });
    }
    navigate('/menu');
  };

    const handleLeaveDungeon = () => {
      updateGameData({ battleState: null });
      navigate('/dungeons');
      toast({
      title: t(language, 'items.dungeonLeft'),
      description: t(language, 'items.allProgressReset'),
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
          {t(language, 'common.backToMenu')}
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="outline" 
          onClick={handleLeaveDungeon}
          className="bg-game-surface/80 hover:bg-game-surface/90 text-game-primary border-game-primary/20"
        >
          <DoorOpen className="mr-2 h-4 w-4" />
          {t(language, 'items.leaveDungeon')}
        </Button>
      </div>

      <div className="relative z-10 pt-20">
        {children}
      </div>
    </div>
  );
};