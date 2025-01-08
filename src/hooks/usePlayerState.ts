import { useState, useEffect } from 'react';
import { PlayerStats, StatUpgrade } from '@/types/battle';
import { calculateRequiredExperience, upgradeStats, checkLevelUp } from '@/utils/experienceManager';
import { useToast } from '@/hooks/use-toast';

export const usePlayerState = (initialLevel: number = 1) => {
  const { toast } = useToast();
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.playerStats) {
        return parsed.playerStats;
      }
    }
    return {
      health: 100,
      maxHealth: 100,
      power: 20,
      defense: 10,
      experience: 0,
      level: initialLevel,
      requiredExperience: calculateRequiredExperience(initialLevel)
    };
  });

  // Save player stats to localStorage whenever they change
  useEffect(() => {
    const savedState = localStorage.getItem('battleState');
    const currentState = savedState ? JSON.parse(savedState) : {};
    
    localStorage.setItem('battleState', JSON.stringify({
      ...currentState,
      playerStats
    }));
  }, [playerStats]);

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
      
      toast({
        title: "🎉 Новый уровень!",
        description: "Выберите улучшение характеристик",
      });
    }
  }, [playerStats.experience, toast]);

  const handleUpgrade = (upgrade: StatUpgrade) => {
    const updatedStats = upgradeStats(playerStats, upgrade);
    setPlayerStats(updatedStats);
    setShowLevelUp(false);
    
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