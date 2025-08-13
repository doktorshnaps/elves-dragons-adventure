import { useState, useEffect } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { TeamPair } from '@/components/game/team/DeckSelection';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const [selectedPairs, setSelectedPairs] = useState<TeamPair[]>([]);
  const [cards, setCards] = useState<CardType[]>(() => {
    try {
      const saved = localStorage.getItem('gameCards');
      return saved ? JSON.parse(saved) : (gameData.cards || []);
    } catch {
      return gameData.cards || [];
    }
  });

  // Keep local cards in sync with game data
  useEffect(() => {
    if (gameData.cards) {
      setCards(gameData.cards);
    }
  }, [gameData.cards]);

  // Load selected team from game data
  useEffect(() => {
    if (gameData.selectedTeam) {
      setSelectedPairs(gameData.selectedTeam);
    }
  }, [gameData.selectedTeam]);

  // Listen for cross-app card updates and localStorage changes
  useEffect(() => {
    const handleCardsUpdate = (e: CustomEvent<{ cards: CardType[] }>) => {
      if (e.detail?.cards) setCards(e.detail.cards);
    };
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('gameCards');
        if (saved) setCards(JSON.parse(saved));
      } catch {}
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 500);

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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
    cards: cards,
    selectedPairs,
    handlePairSelect,
    handlePairRemove,
    handleAssignDragon,
    handleRemoveDragon,
    getSelectedTeamStats
  };
};