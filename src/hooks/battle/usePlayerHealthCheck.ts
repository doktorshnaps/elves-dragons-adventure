import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PlayerStats } from '@/types/battle';

export const usePlayerHealthCheck = (playerStats: PlayerStats | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkBattleState = () => {
      const currentState = localStorage.getItem('battleState');
      if (!currentState) return;

      const state = JSON.parse(currentState);
      if (state.playerStats?.health <= 0) {
        toast({
          title: "Поражение!",
          description: "Ваш герой пал в бою. Подземелье закрыто.",
          variant: "destructive",
          duration: 2000
        });
        
        localStorage.removeItem('battleState');
        setTimeout(() => {
          navigate('/game');
        }, 2000);
      }
    };

    checkBattleState();
  }, [playerStats?.health, navigate, toast]);
};