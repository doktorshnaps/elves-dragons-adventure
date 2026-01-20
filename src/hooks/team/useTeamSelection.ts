import { useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useCards } from '@/hooks/useCards';
import { TeamPair } from '@/components/game/team/DeckSelection';
import { useToast } from '@/hooks/use-toast';
import { checkActiveBattle, clearActiveBattle } from '@/utils/activeBattleChecker';
import { useGameStore } from '@/stores/gameStore';
import { useGameEvent } from '@/contexts/GameEventsContext';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const { cards, loading, getCardById, getCardByInstanceId } = useCards();
  const { toast } = useToast();

  // Cards from useCards() already contain health data from card_instances
  const cardsWithHealth = useMemo(() => cards, [cards]);

  // Build cards map for quick lookup
  const cardsMap = useMemo(() => {
    const byId = new Map<string, CardType>();
    const byInstanceId = new Map<string, CardType>();
    
    cards.forEach(card => {
      byId.set(card.id, card);
      if (card.instanceId) {
        byInstanceId.set(card.instanceId, card);
      }
    });
    
    return { byId, byInstanceId };
  }, [cards]);

  // Build selected team with health from useCards()
  const selectedTeamWithHealth = useMemo(() => {
    const selectedTeam = (gameData.selectedTeam || []) as any[];
    
    return selectedTeam.map((pair: any) => ({
      hero: pair.hero ? (() => {
        const heroLookupId = pair.hero.instanceId || pair.hero.id;
        const card = cardsMap.byInstanceId.get(heroLookupId) || cardsMap.byId.get(heroLookupId);
        
        return card ? {
          ...pair.hero,
          ...card,
          id: card.instanceId || card.id,
          instanceId: card.instanceId || card.id,
        } : pair.hero;
      })() : undefined,
      dragon: pair.dragon ? (() => {
        const dragonLookupId = pair.dragon.instanceId || pair.dragon.id;
        const card = cardsMap.byInstanceId.get(dragonLookupId) || cardsMap.byId.get(dragonLookupId);
        
        return card ? {
          ...pair.dragon,
          ...card,
          id: card.instanceId || card.id,
          instanceId: card.instanceId || card.id,
        } : pair.dragon;
      })() : undefined
    })) as TeamPair[];
  }, [gameData.selectedTeam, cardsMap]);

  const selectedPairs: TeamPair[] = useMemo(() => {
    const source: TeamPair[] = selectedTeamWithHealth.length > 0
      ? (selectedTeamWithHealth as TeamPair[])
      : ((gameData.selectedTeam ?? []) as TeamPair[]);

    // Exclude pairs where hero is in medical bay and drop dragons that are in medical bay
    const filtered: TeamPair[] = source
      .filter(pair => !!pair?.hero)
      .map(pair => {
        // Drop dragons that are currently in medical bay, but keep the hero visible
        if (pair.dragon && (pair.dragon as any).isInMedicalBay) {
          return { ...pair, dragon: undefined };
        }
        return pair;
      });

    return filtered;
  }, [selectedTeamWithHealth, gameData.selectedTeam]);

  // Cleanup: remove non-existing cards AND dead cards (health = 0) from selected team in DB
  useEffect(() => {
    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    if (!baseTeam || baseTeam.length === 0) return;

    // Build set of valid card IDs from cards (use UUID as primary identifier)
    const validIds = new Set<string>();
    const healthMap = new Map<string, number>();
    
    cards.forEach(card => {
      validIds.add(card.id);
      if (card.instanceId) {
        validIds.add(card.instanceId);
      }
      healthMap.set(card.id, card.currentHealth ?? card.health);
      if (card.instanceId) {
        healthMap.set(card.instanceId, card.currentHealth ?? card.health);
      }
    });

    let changed = false;
    const cleaned: TeamPair[] = baseTeam
      .map(pair => {
        let updatedPair = { ...pair };
        
        // Remove dragon if not in validIds
        if (pair?.dragon && !validIds.has(pair.dragon.id) && !validIds.has((pair.dragon as any).instanceId)) {
          console.log(`🧹 Removing non-existing dragon from team: ${pair.dragon.name}`);
          changed = true;
          updatedPair = { ...updatedPair, dragon: undefined };
        }
        
        // Remove dead dragon (health = 0)
        if (pair?.dragon) {
          const dragonId = (pair.dragon as any).instanceId || pair.dragon.id;
          const dragonHealth = healthMap.get(dragonId);
          if (dragonHealth !== undefined && dragonHealth <= 0) {
            console.log(`💀 Removing dead dragon from team: ${pair.dragon.name}`);
            changed = true;
            updatedPair = { ...updatedPair, dragon: undefined };
          }
        }
        
        // Remove hero if not in validIds
        if (pair?.hero && !validIds.has(pair.hero.id) && !validIds.has((pair.hero as any).instanceId)) {
          console.log(`🧹 Removing non-existing hero from team: ${pair.hero.name}`);
          changed = true;
          updatedPair = { ...updatedPair, hero: undefined };
        }
        
        // Remove dead hero (health = 0)
        if (pair?.hero) {
          const heroId = (pair.hero as any).instanceId || pair.hero.id;
          const heroHealth = healthMap.get(heroId);
          if (heroHealth !== undefined && heroHealth <= 0) {
            console.log(`💀 Removing dead hero from team: ${pair.hero.name}`);
            changed = true;
            updatedPair = { ...updatedPair, hero: undefined };
          }
        }
        
        return updatedPair;
      })
      .filter(pair => {
        const keep = !!(pair?.hero || pair?.dragon);
        if (!keep) {
          console.log('🧹 Removing empty pair from team');
          changed = true;
        }
        return keep;
      });

    if (changed) {
      console.warn('🧹 Cleaning selectedTeam: removing non-existing/dead cards', {
        before: baseTeam.length,
        after: cleaned.length
      });
      updateGameData({ selectedTeam: cleaned });
    }
  }, [gameData.selectedTeam, cards, updateGameData]);

  // Listen for team updates from NFT cleanup via GameEventsContext
  useGameEvent('teamUpdate', (payload) => {
    const updatedTeam = payload?.team;
    if (updatedTeam) {
      console.log('🔄 Received teamUpdate event, updating gameData.selectedTeam');
      updateGameData({ selectedTeam: updatedTeam });
    }
  }, [updateGameData]);

  const handlePairSelect = async (hero: CardType, dragon?: CardType) => {
    console.log('🎯 handlePairSelect called with hero:', hero.name);
    
    // Check for active battle before allowing team changes
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой в подземелье. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }
    
    const currentRawTeam = (gameData.selectedTeam || []) as TeamPair[];
    const pairsWithHeroes = currentRawTeam.filter((pair: any) => pair?.hero?.id);
    
    // Check team size limit
    if (pairsWithHeroes.length >= 5) {
      toast({
        title: "Команда заполнена",
        description: "Максимум 5 пар героев в команде",
        variant: "destructive"
      });
      return;
    }

    // Check if hero is already in team
    const isAlreadyInTeam = pairsWithHeroes.some((pair: any) => 
      pair?.hero?.id === hero.id || pair?.hero?.instanceId === hero.instanceId
    );
    if (isAlreadyInTeam) {
      toast({
        title: "Герой уже в команде",
        description: `${hero.name} уже добавлен в команду`,
        variant: "destructive"
      });
      return;
    }

    const heroToSave = {
      ...hero,
      instanceId: (hero as any).instanceId || hero.id
    };
    
    const dragonToSave = dragon ? {
      ...dragon,
      instanceId: (dragon as any).instanceId || dragon.id
    } : undefined;

    const newPair: TeamPair = { 
      hero: heroToSave, 
      dragon: dragonToSave 
    };
    const newPairs = [...currentRawTeam, newPair];
    
    try {
      await updateGameData({
        selectedTeam: newPairs
      });
      
      const { setSelectedTeam } = useGameStore.getState();
      setSelectedTeam(newPairs);
      console.log('✅ Successfully added hero to team');
    } catch (error) {
      console.error('❌ Failed to add hero to team:', error);
    }
  };

  const handlePairRemove = async (index: number) => {
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

    const pair = selectedPairs[index];
    if (!pair?.hero?.id) return;
    const heroId = pair.hero.id;

    const baseTeam = (gameData.selectedTeam ?? []) as TeamPair[];
    const newPairs = baseTeam.filter(p => p?.hero?.id !== heroId);

    await updateGameData({
      selectedTeam: newPairs
    });
    
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
  };

  const handleAssignDragon = async (index: number, dragon: CardType) => {
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    const filteredIndex = selectedPairs[index];
    if (!filteredIndex?.hero?.id) return;
    
    const realIndex = baseTeam.findIndex(pair => pair?.hero?.id === filteredIndex.hero.id);
    if (realIndex === -1) return;
    
    const dragonToSave = {
      ...dragon,
      instanceId: (dragon as any).instanceId || dragon.id
    };
    
    const newPairs = baseTeam.map((pair, i) =>
      i === realIndex ? { ...pair, dragon: dragonToSave } : pair
    );
    
    await updateGameData({
      selectedTeam: newPairs
    });
    
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
  };

  const handleRemoveDragon = async (index: number) => {
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    const filteredIndex = selectedPairs[index];
    if (!filteredIndex?.hero?.id) return;
    
    const realIndex = baseTeam.findIndex(pair => pair?.hero?.id === filteredIndex.hero.id);
    if (realIndex === -1) return;
    
    const newPairs = baseTeam.map((pair, i) =>
      i === realIndex ? { ...pair, dragon: undefined } : pair
    );
    
    await updateGameData({
      selectedTeam: newPairs
    });
    
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
  };

  const getSelectedTeamStats = () => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedPairs.forEach(pair => {
      const heroId = (pair.hero as any).instanceId || pair.hero.id;
      const heroCard = cardsMap.byInstanceId.get(heroId) || cardsMap.byId.get(heroId);
      
      const heroPower = heroCard?.power ?? pair.hero.power ?? 0;
      const heroDefense = heroCard?.currentDefense ?? pair.hero.currentDefense ?? pair.hero.defense ?? 0;
      const heroHealth = heroCard?.currentHealth ?? pair.hero.currentHealth ?? pair.hero.health ?? 0;
      
      totalPower += heroPower;
      totalDefense += heroDefense;
      totalHealth += heroHealth;

      // Add dragon stats if present and same faction
      if (pair.dragon && pair.dragon.faction === pair.hero.faction) {
        const dragonId = (pair.dragon as any).instanceId || pair.dragon.id;
        const dragonCard = cardsMap.byInstanceId.get(dragonId) || cardsMap.byId.get(dragonId);
        
        // Check rarity rule - dragon rarity must be <= hero rarity
        const heroRarity = heroCard?.rarity ?? pair.hero.rarity ?? 0;
        const dragonRarity = dragonCard?.rarity ?? pair.dragon.rarity ?? 0;
        
        if (dragonRarity <= heroRarity) {
          const dragonPower = dragonCard?.power ?? pair.dragon.power ?? 0;
          const dragonDefense = dragonCard?.currentDefense ?? pair.dragon.currentDefense ?? pair.dragon.defense ?? 0;
          const dragonHealth = dragonCard?.currentHealth ?? pair.dragon.currentHealth ?? pair.dragon.health ?? 0;
          
          totalPower += dragonPower;
          totalDefense += dragonDefense;
          totalHealth += dragonHealth;
        }
      }
    });

    return {
      power: totalPower,
      defense: totalDefense,
      health: totalHealth,
      mana: 0
    };
  };

  // Separate heroes and dragons for selection
  const heroes = useMemo(() => {
    return cards.filter(card => card.type === 'character');
  }, [cards]);

  const dragons = useMemo(() => {
    return cards.filter(card => card.type === 'pet');
  }, [cards]);

  return {
    cardsWithHealth,
    heroes,
    dragons,
    selectedPairs,
    selectedTeamWithHealth,
    handlePairSelect,
    handlePairRemove,
    handleAssignDragon,
    handleRemoveDragon,
    getSelectedTeamStats,
    loading
  };
};
