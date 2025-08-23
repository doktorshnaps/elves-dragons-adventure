import { useState, useEffect } from 'react';
import { TeamPair, TeamBattleState, BattleAction } from '@/types/teamBattle';
import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { useTeamSelection } from './useTeamSelection';
import { addAccountExperience, getLevelFromXP } from '@/utils/accountLeveling';
import { useGameStore } from '@/stores/gameStore';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  
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

    // Добавляем опыт аккаунта за убийство монстра
    if (newTargetHealth <= 0) {
      const expReward = (accountLevel * 5) + 45 + (target.isBoss ? 150 : 0);
      const experienceResult = addAccountExperience(accountExperience, expReward);
      
      addAccountExp(expReward);
      
      if (experienceResult.leveledUp) {
        toast({
          title: "Уровень аккаунта повышен!",
          description: `Достигнут ${experienceResult.newLevel} уровень аккаунта! Получено ${expReward} опыта`,
        });
      } else {
        toast({
          title: "Опыт получен!",
          description: `Получено ${expReward} опыта аккаунта`,
        });
      }
    }

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
      // Враг (в т.ч. босс) отвечает атакующей паре
      const enemy = battleState.opponents.find(o => o.id === attackerId);
      const pair = battleState.playerPairs.find(p => p.id === targetId);
      
      if (!enemy || !pair || pair.health <= 0) return;

      const damage = Math.max(1, enemy.power - pair.defense);
      const newPairHealth = Math.max(0, pair.health - damage);

      setBattleState(prev => ({
        ...prev,
        playerPairs: prev.playerPairs.map(p =>
          p.id === pair.id 
            ? { ...p, health: newPairHealth }
            : p
        )
      }));

      toast({
        title: "Ответный удар врага!",
        description: `${enemy.name} наносит ${damage} урона в ответ!`,
        variant: "destructive"
      });
    } else {
      // Пара отвечает врагу
      const pair = battleState.playerPairs.find(p => p.id === attackerId);
      const enemy = battleState.opponents.find(o => o.id === targetId);
      
      if (!pair || !enemy || enemy.health <= 0) return;

      const damage = Math.max(1, pair.power - (enemy.defense || 0));
      const newEnemyHealth = Math.max(0, enemy.health - damage);

      setBattleState(prev => ({
        ...prev,
        opponents: prev.opponents.map(opp => 
          opp.id === enemy.id 
            ? { ...opp, health: newEnemyHealth }
            : opp
        ).filter(opp => opp.health > 0)
      }));

      // Добавляем опыт аккаунта за убийство монстра в ответном ударе
      if (newEnemyHealth <= 0) {
        const expReward = (accountLevel * 5) + 45 + (enemy.isBoss ? 150 : 0);
        const experienceResult = addAccountExperience(accountExperience, expReward);
        
        addAccountExp(expReward);
        
        if (experienceResult.leveledUp) {
          toast({
            title: "Уровень аккаунта повышен!",
            description: `Достигнут ${experienceResult.newLevel} уровень аккаунта! Получено ${expReward} опыта`,
          });
        } else {
          toast({
            title: "Опыт получен!",
            description: `Получено ${expReward} опыта аккаунта`,
          });
        }
      }

      toast({
        title: "Ответный удар!",
        description: `${pair.hero.name} наносит ${damage} урона в ответ!`,
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
      const aliveOpponents = prev.opponents.filter(o => o.health > 0).length;
      const alivePairs = prev.playerPairs.filter(p => p.health > 0).length;

      // If one side has no units alive, do not switch turn (prevents unintended resets)
      if (aliveOpponents === 0 || alivePairs === 0) {
        return prev;
      }

      if (prev.currentTurn === 'player') {
        return {
          ...prev,
          currentTurn: 'enemy',
          currentAttacker: 0
        };
      } else {
        const nextIndex = alivePairs > 0 ? (prev.currentAttacker + 1) % alivePairs : 0;
        return {
          ...prev,
          currentTurn: 'player',
          currentAttacker: nextIndex
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
    handleLevelComplete,
    isPlayerTurn: battleState.currentTurn === 'player',
    alivePairs: battleState.playerPairs.filter(pair => pair.health > 0),
    aliveOpponents: battleState.opponents.filter(opp => opp.health > 0)
  };
};