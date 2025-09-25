import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { checkActiveBattle, clearActiveBattle, ActiveBattleInfo } from '@/utils/activeBattleChecker';
import { useToast } from '@/hooks/use-toast';
import { useGameData } from '@/hooks/useGameData';

interface ActiveBattleWarningProps {
  onBattleCleared?: () => void;
}

export const ActiveBattleWarning: React.FC<ActiveBattleWarningProps> = ({ onBattleCleared }) => {
  const [activeBattleInfo, setActiveBattleInfo] = React.useState<ActiveBattleInfo | null>(null);
  const { toast } = useToast();
  const { updateGameData } = useGameData();

  React.useEffect(() => {
    const checkBattle = () => {
      const info = checkActiveBattle();
      setActiveBattleInfo(info.hasActiveBattle ? info : null);
    };

    checkBattle();

    // Listen for battle reset events
    const handleBattleReset = () => {
      setActiveBattleInfo(null);
      onBattleCleared?.();
    };

    window.addEventListener('battleReset', handleBattleReset);
    
    // Check periodically in case battle state changes
    const interval = setInterval(checkBattle, 5000);

    return () => {
      window.removeEventListener('battleReset', handleBattleReset);
      clearInterval(interval);
    };
  }, [onBattleCleared]);

  const handleClearBattle = async () => {
    try {
      const cleared = await clearActiveBattle(updateGameData);
      if (cleared) {
        toast({
          title: "Бой сброшен",
          description: "Активное подземелье закрыто. Теперь вы можете изменить команду.",
        });
        setActiveBattleInfo(null);
        onBattleCleared?.();
      } else {
        toast({
          title: "Ошибка",
          description: "Не удалось сбросить активный бой",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error clearing battle:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сбросе боя",
        variant: "destructive"
      });
    }
  };

  if (!activeBattleInfo) {
    return null;
  }

  return (
    <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-4">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Активное подземелье
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              У вас есть активный бой в подземелье
              {activeBattleInfo.activeDungeon && ` "${activeBattleInfo.activeDungeon}"`}.
              Завершите его или сбросьте, чтобы изменить команду.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={handleClearBattle}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Сбросить бой
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};