import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { TeamPair } from '@/components/game/team/DeckSelection';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const [selectedPairs, setSelectedPairs] = useState<TeamPair[]>([]);

  // Load selected team from game data
  useEffect(() => {
    if (gameData.selectedTeam) {
      setSelectedPairs(gameData.selectedTeam);
    }
  }, [gameData.selectedTeam]);

  const handlePairSelect = async (hero: CardType, dragon?: CardType) => {
    if (selectedPairs.length >= 5) return;

    const newPair: TeamPair = { hero, dragon };
    const newPairs = [...selectedPairs, newPair];
    
    setSelectedPairs(newPairs);
    
    // Save to game data
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handlePairRemove = async (index: number) => {
    const newPairs = selectedPairs.filter((_, i) => i !== index);
    setSelectedPairs(newPairs);
    
    // Save to game data
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const getSelectedTeamStats = () => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedPairs.forEach(pair => {
      // Add hero stats
      totalPower += pair.hero.power;
      totalDefense += pair.hero.defense;
      totalHealth += pair.hero.health;

      // Add dragon stats if present and same faction
      if (pair.dragon && pair.dragon.faction === pair.hero.faction) {
        totalPower += pair.dragon.power;
        totalDefense += pair.dragon.defense;
        totalHealth += pair.dragon.health;
      }
    });

    return {
      power: totalPower,
      defense: totalDefense,
      health: totalHealth,
      maxHealth: totalHealth
    };
  };

  return {
    cards: gameData.cards,
    selectedPairs,
    handlePairSelect,
    handlePairRemove,
    getSelectedTeamStats
  };
};