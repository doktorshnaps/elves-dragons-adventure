import { useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { useCardInstances } from '@/hooks/useCardInstances';
import { TeamPair } from '@/components/game/team/DeckSelection';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const { cardInstances } = useCardInstances();

  // Build cards with health using the SAME gameData instance to avoid desync
  const cardsWithHealth = useMemo(() => {
    const cards = (gameData.cards || []) as CardType[];
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    return cards.map(card => {
      const instance = instancesMap.get(card.id);
      if (instance) {
        return {
          ...card,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } as CardType;
      }
      return card;
    });
  }, [gameData.cards, cardInstances]);

  // Build selected team with health using the SAME gameData instance
  const selectedTeamWithHealth = useMemo(() => {
    const selectedTeam = (gameData.selectedTeam || []) as any[];
    const instancesMap = new Map(cardInstances.map(ci => [ci.card_template_id, ci]));
    return selectedTeam.map((pair: any) => ({
      hero: pair.hero ? (() => {
        const instance = instancesMap.get(pair.hero.id);
        return instance ? {
          ...pair.hero,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } : pair.hero;
      })() : undefined,
      dragon: pair.dragon ? (() => {
        const instance = instancesMap.get(pair.dragon.id);
        return instance ? {
          ...pair.dragon,
          currentHealth: instance.current_health,
          lastHealTime: new Date(instance.last_heal_time).getTime(),
          isInMedicalBay: instance.is_in_medical_bay || false
        } : pair.dragon;
      })() : undefined
    })) as TeamPair[];
  }, [gameData.selectedTeam, cardInstances]);
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
    console.log('🎯 handlePairSelect called with hero:', hero.name);
    console.log('🎯 Current selectedPairs (filtered):', selectedPairs.length);
    console.log('🎯 Current gameData.selectedTeam (raw):', (gameData.selectedTeam || []).length);
    console.log('🎯 Is hero already selected?', selectedPairs.some(pair => pair.hero.id === hero.id));
    
    const currentRawTeam = (gameData.selectedTeam || []) as TeamPair[];
    
    // Check team size limit against RAW team data (including medical bay)
    if (currentRawTeam.length >= 5) {
      console.warn('🚫 Team is full (raw team), cannot add more heroes');
      return;
    }

    // Check if hero is already in team (including medical bay)
    const isAlreadyInTeam = currentRawTeam.some((pair: any) => pair?.hero?.id === hero.id);
    if (isAlreadyInTeam) {
      console.warn('🚫 Hero already in team:', hero.name);
      return;
    }

    const newPair: TeamPair = { hero, dragon };
    const newPairs = [...currentRawTeam, newPair];
    
    console.log('🎯 Adding new pair to team. Raw team size will be:', newPairs.length);
    
    // Save to game data
    try {
      await updateGameData({
        selectedTeam: newPairs
      });
      console.log('✅ Successfully added hero to team');
    } catch (error) {
      console.error('❌ Failed to add hero to team:', error);
    }
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
    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    const filteredIndex = selectedPairs[index];
    if (!filteredIndex?.hero?.id) return;
    
    // Find the real index in the base team
    const realIndex = baseTeam.findIndex(pair => pair?.hero?.id === filteredIndex.hero.id);
    if (realIndex === -1) return;
    
    const newPairs = baseTeam.map((pair, i) =>
      i === realIndex ? { ...pair, dragon } : pair
    );
    
    await updateGameData({
      selectedTeam: newPairs
    });
  };

  const handleRemoveDragon = async (index: number) => {
    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    const filteredIndex = selectedPairs[index];
    if (!filteredIndex?.hero?.id) return;
    
    // Find the real index in the base team
    const realIndex = baseTeam.findIndex(pair => pair?.hero?.id === filteredIndex.hero.id);
    if (realIndex === -1) return;
    
    const newPairs = baseTeam.map((pair, i) =>
      i === realIndex ? { ...pair, dragon: undefined } : pair
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