import { useEffect, useMemo } from 'react';
import { Card as CardType } from "@/types/cards";
import { useGameData } from '@/hooks/useGameData';
import { useCardHealthSync } from '@/hooks/useCardHealthSync';
import { useCardInstances } from '@/hooks/useCardInstances';
import { TeamPair } from '@/components/game/team/DeckSelection';
import { useToast } from '@/hooks/use-toast';
import { checkActiveBattle, clearActiveBattle } from '@/utils/activeBattleChecker';
import { calculateCardStats } from '@/utils/cardUtils';
import { useGameStore } from '@/stores/gameStore';

export const useTeamSelection = () => {
  const { gameData, updateGameData } = useGameData();
  const { cardInstances } = useCardInstances();
  const { toast } = useToast();

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

  // Cleanup: remove non-existing cards from selected team in DB
  useEffect(() => {
    const baseTeam = (gameData.selectedTeam || []) as TeamPair[];
    if (!baseTeam || baseTeam.length === 0) return;

    const validIds = new Set<string>([
      ...cardInstances.map(ci => ci.card_template_id),
      ...((gameData.cards || []) as CardType[]).map(c => c.id)
    ]);

    let changed = false;
    const cleaned: TeamPair[] = baseTeam
      .map(pair => {
        let updatedPair = { ...pair };
        
        // КРИТИЧНО: Удаляем дракона, если его больше нет в validIds (включая NFT)
        if (pair?.dragon && !validIds.has(pair.dragon.id)) {
          console.log(`🧹 Removing non-existing dragon from team: ${pair.dragon.name} (isNFT: ${pair.dragon.isNFT})`);
          changed = true;
          updatedPair = { ...updatedPair, dragon: undefined };
        }
        
        // КРИТИЧНО: Удаляем героя, если его больше нет в validIds (включая NFT)
        if (pair?.hero && !validIds.has(pair.hero.id)) {
          console.log(`🧹 Removing non-existing hero from team: ${pair.hero.name} (isNFT: ${pair.hero.isNFT})`);
          changed = true;
          updatedPair = { ...updatedPair, hero: undefined };
        }
        
        return updatedPair;
      })
      .filter(pair => {
        // Сохраняем пару только если есть хотя бы герой ИЛИ дракон
        const keep = !!(pair?.hero || pair?.dragon);
        if (!keep) {
          console.log('🧹 Removing empty pair from team');
          changed = true;
        }
        return keep;
      });

    if (changed) {
      console.warn('🧹 Cleaning selectedTeam: removing non-existing cards', {
        before: baseTeam.length,
        after: cleaned.length
      });
      updateGameData({ selectedTeam: cleaned });
    }
  }, [gameData.selectedTeam, gameData.cards, cardInstances, updateGameData]);

  // Listen for team updates from NFT cleanup
  useEffect(() => {
    const handleTeamUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedTeam = customEvent.detail?.team;
      if (updatedTeam) {
        console.log('🔄 Received teamUpdate event, updating gameData.selectedTeam');
        updateGameData({ selectedTeam: updatedTeam });
      }
    };

    window.addEventListener('teamUpdate', handleTeamUpdate);
    return () => window.removeEventListener('teamUpdate', handleTeamUpdate);
  }, [updateGameData]);

  // Use the health synchronization hook
  useCardHealthSync();

  const handlePairSelect = async (hero: CardType, dragon?: CardType) => {
    console.log('🎯 handlePairSelect called with hero:', hero.name);
    console.log('🎯 Current selectedPairs (filtered):', selectedPairs.length);
    console.log('🎯 Current gameData.selectedTeam (raw):', (gameData.selectedTeam || []).length);
    console.log('🎯 Is hero already selected?', selectedPairs.some(pair => pair.hero.id === hero.id));
    
    // Check for active battle before allowing team changes
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой в подземелье${activeBattleInfo.activeDungeon ? ` (${activeBattleInfo.activeDungeon})` : ''}. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }
    
    const currentRawTeam = (gameData.selectedTeam || []) as TeamPair[];
    
    // КРИТИЧНО: Считаем только пары с реальными героями, исключаем пустые пары
    const pairsWithHeroes = currentRawTeam.filter((pair: any) => pair?.hero?.id);
    console.log('🔍 Team check:', {
      rawLength: currentRawTeam.length,
      withHeroes: pairsWithHeroes.length,
      rawTeam: currentRawTeam.map((p: any) => ({ hero: p?.hero?.name, hasHero: !!p?.hero }))
    });
    
    // Check team size limit - allow up to 5 pairs WITH heroes
    if (pairsWithHeroes.length >= 5) {
      console.warn('🚫 Team is full (5/5 pairs with heroes), cannot add more');
      toast({
        title: "Команда заполнена",
        description: "Максимум 5 пар героев в команде",
        variant: "destructive"
      });
      return;
    }

    // Check if hero is already in team (including medical bay)
    const isAlreadyInTeam = pairsWithHeroes.some((pair: any) => pair?.hero?.id === hero.id);
    if (isAlreadyInTeam) {
      console.warn('🚫 Hero already in team:', hero.name);
      toast({
        title: "Герой уже в команде",
        description: `${hero.name} уже добавлен в команду`,
        variant: "destructive"
      });
      return;
    }

    const newPair: TeamPair = { hero, dragon };
    const newPairs = [...currentRawTeam, newPair];
    
    console.log('🎯 Adding new pair to team. Raw team size will be:', newPairs.length);
    
    // Save to game data AND update gameStore immediately
    try {
      await updateGameData({
        selectedTeam: newPairs
      });
      
      // Immediately sync to gameStore for instant UI update
      const { setSelectedTeam } = useGameStore.getState();
      setSelectedTeam(newPairs);
      console.log('✅ Successfully added hero to team and synced to store');
    } catch (error) {
      console.error('❌ Failed to add hero to team:', error);
    }
  };

  const handlePairRemove = async (index: number) => {
    // Check for active battle before allowing team changes
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой в подземелье${activeBattleInfo.activeDungeon ? ` (${activeBattleInfo.activeDungeon})` : ''}. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

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
    
    // Immediately sync to gameStore
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
    console.log('✅ Pair removed and synced to store');
  };

  const handleAssignDragon = async (index: number, dragon: CardType) => {
    // Check for active battle before allowing team changes
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой в подземелье${activeBattleInfo.activeDungeon ? ` (${activeBattleInfo.activeDungeon})` : ''}. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

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
    
    // Immediately sync to gameStore
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
    console.log('✅ Dragon assigned and synced to store');
  };

  const handleRemoveDragon = async (index: number) => {
    // Check for active battle before allowing team changes
    const activeBattleInfo = checkActiveBattle();
    if (activeBattleInfo.hasActiveBattle) {
      toast({
        title: "Активное подземелье",
        description: `У вас есть активный бой в подземелье${activeBattleInfo.activeDungeon ? ` (${activeBattleInfo.activeDungeon})` : ''}. Завершите его или сбросьте, чтобы изменить команду.`,
        variant: "destructive"
      });
      return;
    }

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
    
    // Immediately sync to gameStore
    const { setSelectedTeam } = useGameStore.getState();
    setSelectedTeam(newPairs);
    console.log('✅ Dragon removed and synced to store');
  };

  const getSelectedTeamStats = () => {
    let totalPower = 0;
    let totalDefense = 0;
    let totalHealth = 0;

    selectedPairs.forEach(pair => {
      // КРИТИЧНО: всегда используем calculateCardStats для корректных значений силы и защиты
      const heroStats = calculateCardStats(pair.hero.name, pair.hero.rarity, pair.hero.type);
      totalPower += heroStats.power;
      totalDefense += heroStats.defense;
      totalHealth += pair.hero.currentHealth ?? pair.hero.health ?? heroStats.health;

      // Add dragon stats if present and same faction (use current health from card instances)
      if (pair.dragon && pair.dragon.faction === pair.hero.faction) {
        const dragonStats = calculateCardStats(pair.dragon.name, pair.dragon.rarity, pair.dragon.type);
        totalPower += dragonStats.power;
        totalDefense += dragonStats.defense;
        totalHealth += pair.dragon.currentHealth ?? pair.dragon.health ?? dragonStats.health;
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