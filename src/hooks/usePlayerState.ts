import { useState, useEffect } from 'react';
import { PlayerStats, StatUpgrade } from '@/types/battle';
import { calculateRequiredExperience, upgradeStats, checkLevelUp } from '@/utils/experienceManager';
import { useToast } from '@/hooks/use-toast';
import { calculateTeamStats } from '@/utils/cardUtils';

export const usePlayerState = (initialLevel: number = 1, initialStats?: PlayerStats) => {
  const { toast } = useToast();
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    if (initialStats) {
      return initialStats;
    }

    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);

    return {
      health: teamStats.health,
      maxHealth: teamStats.health,
      power: teamStats.power,
      defense: teamStats.defense,
      experience: 0,
      level: initialLevel,
      requiredExperience: calculateRequiredExperience(initialLevel)
    };
  });

  // Проверяем повышение уровня при изменении опыта
  useEffect(() => {
    if (playerStats && checkLevelUp(playerStats)) {
      const newStats = {
        ...playerStats,
        level: playerStats.level + 1,
        experience: playerStats.experience - playerStats.requiredExperience,
        requiredExperience: calculateRequiredExperience(playerStats.level + 1)
      };
      
      setPlayerStats(newStats);
      setShowLevelUp(true);
      
      // Сохраняем обновленные статы в localStorage
      const savedState = localStorage.getItem('battleState');
      const currentState = savedState ? JSON.parse(savedState) : {};
      localStorage.setItem('battleState', JSON.stringify({
        ...currentState,
        playerStats: newStats
      }));
      
      toast({
        title: "🎉 Новый уровень!",
        description: "Выберите улучшение характеристик",
      });
    }
  }, [playerStats?.experience, toast]);

  const handleUpgrade = (upgrade: StatUpgrade) => {
    const updatedStats = upgradeStats(playerStats, upgrade);
    setPlayerStats(updatedStats);
    setShowLevelUp(false);
    
    // Сохраняем обновленные статы в localStorage
    const savedState = localStorage.getItem('battleState');
    const currentState = savedState ? JSON.parse(savedState) : {};
    localStorage.setItem('battleState', JSON.stringify({
      ...currentState,
      playerStats: updatedStats
    }));
    
    toast({
      title: "Характеристики улучшены!",
      description: "Ваш герой стал сильнее!",
    });
  };

  return {
    playerStats,
    setPlayerStats,
    showLevelUp,
    setShowLevelUp,
    handleUpgrade
  };
};