import { useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { useCardsWithHealth } from '@/hooks/useCardsWithHealth';
import { TeamPair } from '@/components/game/team/DeckSelection';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const { cardsWithHealth, selectedTeamWithHealth } = useCardsWithHealth();
  const selectedPairs: TeamPair[] = useMemo(() => {
    const source: TeamPair[] = selectedTeamWithHealth.length > 0
      ? (selectedTeamWithHealth as TeamPair[])
      : ((gameData.selectedTeam ?? []) as TeamPair[]);

    // Exclude pairs where hero is in medical bay and drop dragons that are in medical bay
    const filtered: TeamPair[] = source
      .filter(pair => pair?.hero && !(pair.hero as any).isInMedicalBay)
      .map(pair => {
        if (pair.dragon && (pair.dragon as any).isInMedicalBay) {
          return { ...pair, dragon: undefined };
        }
        return pair;
      });

    return filtered;
  }, [selectedTeamWithHealth, gameData.selectedTeam]);

  // Use the health synchronization hook
  useCardHealthSync();

  const handlePairSelect = async (hero: CardType, dragon?: CardType) => {
    if (selectedPairs.length >= 5) return;

    const newPair: TeamPair = { hero, dragon };
    const newPairs = [...selectedPairs, newPair];
    
    // Save to game data
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handlePairRemove = async (index: number) => {
    const pair = selectedPairs[index];
    if (!pair?.hero?.id) return;
    const heroId = pair.hero.id;

    console.log('🗑️ Removing pair by heroId:', heroId, 'at filtered index:', index);

    const baseTeam = (gameData.selectedTeam ?? []) as TeamPair[];
    const newPairs = baseTeam.filter(p => p?.hero?.id !== heroId);

    console.log('🗑️ Team before:', baseTeam.length, 'after:', newPairs.length);

    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handleAssignDragon = async (index: number, dragon: CardType) => {
    const newPairs = selectedPairs.map((pair, i) =>
      i === index ? { ...pair, dragon } : pair
    );
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handleRemoveDragon = async (index: number) => {
    const newPairs = selectedPairs.map((pair, i) =>
      i === index ? { ...pair, dragon: undefined } : pair
    );
    
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