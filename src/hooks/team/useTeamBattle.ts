import { useState, useEffect } from 'react';
import { TeamPair, TeamBattleState, BattleAction } from '@/types/teamBattle';
import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { useTeamSelection } from './useTeamSelection';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  
  const [battleState, setBattleState] = useState<TeamBattleState>(() => {
    const savedState = localStorage.getItem('teamBattleState');
    if (savedState) {
      return JSON.parse(savedState);
    }
    
    return {
      playerPairs: [],
      opponents: [],
      currentTurn: 'player',
      currentAttacker: 0,
      level: initialLevel,
      selectedDungeon: dungeonType
    };
  });

  const [attackOrder, setAttackOrder] = useState<string[]>([]);

  // Initialize battle with team pairs
  useEffect(() => {
    if (selectedPairs.length > 0 && battleState.playerPairs.length === 0) {
      const teamPairs: TeamPair[] = selectedPairs.map((pair, index) => {
        const heroStats = pair.hero;
        const dragonStats = pair.dragon || { power: 0, defense: 0, health: 0 };
        
        return {
          id: `pair-${index}`,
          hero: pair.hero,
          dragon: pair.dragon,
          health: heroStats.health + dragonStats.health,
          maxHealth: heroStats.health + dragonStats.health,
          power: heroStats.power + dragonStats.power,
          defense: heroStats.defense + dragonStats.defense,
          attackOrder: index + 1
        };
      });

      const opponents = generateDungeonOpponents(dungeonType, initialLevel);
      
      setBattleState(prev => ({
        ...prev,
        playerPairs: teamPairs,
        opponents,
        selectedDungeon: dungeonType
      }));
      
      setAttackOrder(teamPairs.map(pair => pair.id));
    }
  }, [selectedPairs, dungeonType, initialLevel]);

  // Save battle state
  useEffect(() => {
    if (battleState.playerPairs.length > 0) {
      localStorage.setItem('teamBattleState', JSON.stringify(battleState));
    }
  }, [battleState]);

  const updateAttackOrder = (newOrder: string[]) => {
    setAttackOrder(newOrder);
    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair => ({
        ...pair,
        attackOrder: newOrder.indexOf(pair.id) + 1
      }))
    }));
  };

  const executePlayerAttack = (pairId: string, targetId: number) => {
    const attackingPair = battleState.playerPairs.find(p => p.id === pairId);
    const target = battleState.opponents.find(o => o.id === targetId);
    
    if (!attackingPair || !target) return;

    const damage = Math.max(1, attackingPair.power - (target.defense || 0));
    const newTargetHealth = Math.max(0, target.health - damage);

    setBattleState(prev => ({
      ...prev,
      opponents: prev.opponents.map(opp => 
        opp.id === targetId 
          ? { ...opp, health: newTargetHealth }
          : opp
      ).filter(opp => opp.health > 0)
    }));

    toast({
      title: "Атака!",
      description: `${attackingPair.hero.name} наносит ${damage} урона!`,
    });

    // Ответный удар противника, если он жив
    if (newTargetHealth > 0) {
      setTimeout(() => {
        executeCounterAttack(targetId, pairId, true);
      }, 800);
    }

    // Check if all enemies defeated
    if (battleState.opponents.filter(o => o.health > 0).length === 1 && newTargetHealth === 0) {
      setTimeout(() => {
        handleLevelComplete();
      }, 1200);
    } else {
      // Switch to next attacker or enemy turn
      setTimeout(() => {
        switchTurn();
      }, 1200);
    }
  };

  const executeCounterAttack = (attackerId: string | number, targetId: string | number, isEnemyAttacker: boolean) => {
    if (isEnemyAttacker) {
      // Противник атакует, пара отвечает
      const attacker = battleState.opponents.find(o => o.id === attackerId);
      const defender = battleState.playerPairs.find(p => p.id === targetId);
      
      if (!attacker || !defender || defender.health <= 0) return;

      const damage = Math.max(1, defender.power - (attacker.defense || 0));
      const newAttackerHealth = Math.max(0, attacker.health - damage);

      setBattleState(prev => ({
        ...prev,
        opponents: prev.opponents.map(opp => 
          opp.id === attackerId 
            ? { ...opp, health: newAttackerHealth }
            : opp
        ).filter(opp => opp.health > 0)
      }));

      toast({
        title: "Ответный удар!",
        description: `${defender.hero.name} наносит ${damage} урона в ответ!`,
      });
    } else {
      // Пара атакует, противник отвечает  
      const attacker = battleState.playerPairs.find(p => p.id === attackerId);
      const defender = battleState.opponents.find(o => o.id === targetId);
      
      if (!attacker || !defender || attacker.health <= 0) return;

      const damage = Math.max(1, defender.power - attacker.defense);
      const newAttackerHealth = Math.max(0, attacker.health - damage);

      setBattleState(prev => ({
        ...prev,
        playerPairs: prev.playerPairs.map(pair =>
          pair.id === attackerId 
            ? { ...pair, health: newAttackerHealth }
            : pair
        )
      }));

      toast({
        title: "Ответный удар врага!",
        description: `${defender.name} наносит ${damage} урона в ответ!`,
        variant: "destructive"
      });
    }
  };

  const executeEnemyAttack = () => {
    if (battleState.opponents.length === 0) return;

    const alivePairs = battleState.playerPairs.filter(pair => pair.health > 0);
    const aliveOpponents = battleState.opponents.filter(opp => opp.health > 0);
    
    if (alivePairs.length === 0) {
      handleGameOver();
      return;
    }

    // Enemy attacks random alive pair
    const currentEnemy = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
    const targetPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
    const damage = Math.max(1, currentEnemy.power - targetPair.defense);
    const newHealth = Math.max(0, targetPair.health - damage);

    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair =>
        pair.id === targetPair.id
          ? { ...pair, health: newHealth }
          : pair
      )
    }));

    toast({
      title: "Враг атакует!",
      description: `${currentEnemy.name} наносит ${damage} урона!`,
      variant: "destructive"
    });

    // Ответный удар пары, если она жива
    if (newHealth > 0) {
      setTimeout(() => {
        executeCounterAttack(targetPair.id, currentEnemy.id, false);
      }, 800);
    }

    if (alivePairs.length === 1 && newHealth === 0) {
      setTimeout(() => {
        handleGameOver();
      }, 1200);
    } else {
      setTimeout(() => {
        switchTurn();
      }, 1200);
    }
  };

  const switchTurn = () => {
    setBattleState(prev => {
      if (prev.currentTurn === 'player') {
        return {
          ...prev,
          currentTurn: 'enemy',
          currentAttacker: 0
        };
      } else {
        return {
          ...prev,
          currentTurn: 'player',
          currentAttacker: (prev.currentAttacker + 1) % prev.opponents.length
        };
      }
    });
  };

  const handleLevelComplete = () => {
    toast({
      title: "Уровень завершен!",
      description: "Переход на следующий уровень...",
    });

    const nextLevel = battleState.level + 1;
    const newOpponents = generateDungeonOpponents(dungeonType, nextLevel);

    setBattleState(prev => ({
      ...prev,
      level: nextLevel,
      opponents: newOpponents,
      currentTurn: 'player',
      currentAttacker: 0
    }));
  };

  const handleGameOver = () => {
    toast({
      title: "Поражение!",
      description: "Ваша команда пала в бою...",
      variant: "destructive"
    });

    localStorage.removeItem('teamBattleState');
  };

  const resetBattle = () => {
    localStorage.removeItem('teamBattleState');
    setBattleState({
      playerPairs: [],
      opponents: [],
      currentTurn: 'player',
      currentAttacker: 0,
      level: 1,
      selectedDungeon: dungeonType
    });
  };

  return {
    battleState,
    attackOrder,
    updateAttackOrder,
    executePlayerAttack,
    executeEnemyAttack,
    executeCounterAttack,
    resetBattle,
    isPlayerTurn: battleState.currentTurn === 'player',
    alivePairs: battleState.playerPairs.filter(pair => pair.health > 0),
    aliveOpponents: battleState.opponents.filter(opp => opp.health > 0)
  };
};