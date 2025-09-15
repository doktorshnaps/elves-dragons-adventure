import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { TeamPair } from '@/components/game/team/DeckSelection';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const [selectedPairs, setSelectedPairs] = useState<TeamPair[]>([]);

  // Load selected team from game data with actual health
  useEffect(() => {
    if (selectedTeamWithHealth.length > 0) {
      setSelectedPairs(selectedTeamWithHealth);
    } else if (gameData.selectedTeam) {
      setSelectedPairs(gameData.selectedTeam);
    }
  }, [selectedTeamWithHealth, gameData.selectedTeam]);

  // Use the health synchronization hook
  useCardHealthSync();

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

  const handleAssignDragon = async (index: number, dragon: CardType) => {
    const newPairs = selectedPairs.map((pair, i) =>
      i === index ? { ...pair, dragon } : pair
    );
    setSelectedPairs(newPairs);
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handleRemoveDragon = async (index: number) => {
    const newPairs = selectedPairs.map((pair, i) =>
      i === index ? { ...pair, dragon: undefined } : pair
    );
    setSelectedPairs(newPairs);
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const getSelectedTeamStats = () => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedPairs.forEach(pair => {
      // Add hero stats (use current health from card instances)
      totalPower += pair.hero.power;
      totalDefense += pair.hero.defense;
      totalHealth += pair.hero.currentHealth ?? pair.hero.health;

      // Add dragon stats if present and same faction (use current health from card instances)
      if (pair.dragon && pair.dragon.faction === pair.hero.faction) {
        totalPower += pair.dragon.power;
        totalDefense += pair.dragon.defense;
        totalHealth += pair.dragon.currentHealth ?? pair.dragon.health;
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
    cards: cardsWithHealth,
    selectedPairs,
    handlePairSelect,
    handlePairRemove,
    handleAssignDragon,
    handleRemoveDragon,
    getSelectedTeamStats
  };
};