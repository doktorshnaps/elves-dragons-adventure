import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PlayerStats } from '@/types/battle';
import { useGameStore } from '@/stores/gameStore';

/**
 * РЕФАКТОРИНГ: Убрано чтение из localStorage
 * Состояние боя проверяется через playerStats пропс и Zustand
 */
export const usePlayerHealthCheck = (playerStats: PlayerStats | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const clearBattleState = useGameStore((state) => state.clearBattleState);

  useEffect(() => {
    // Проверяем здоровье напрямую через пропс
    if (playerStats && playerStats.health <= 0) {
      toast({
        title: "Поражение!",
        description: "Ваш герой пал в бою.",
        variant: "destructive",
        duration: 2000
      });
      
      // Очищаем состояние боя в Zustand
      clearBattleState();
      
      setTimeout(() => {
        navigate('/menu');
      }, 2000);
    }
  }, [playerStats?.health, navigate, toast, clearBattleState]);
};
