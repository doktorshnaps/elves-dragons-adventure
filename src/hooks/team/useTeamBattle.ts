import { useState, useEffect, startTransition } from 'react';
import { TeamPair, TeamBattleState, BattleAction } from '@/types/teamBattle';
import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType } from '@/constants/dungeons';
import { useTeamSelection } from './useTeamSelection';
import { addAccountExperience, getLevelFromXP } from '@/utils/accountLeveling';
import { useGameStore } from '@/stores/gameStore';
import { applyDamageToPair } from '@/utils/battleHealthUtils';
import { useGameData } from '@/hooks/useGameData';
import { HERO_ABILITIES } from '@/types/abilities';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  const { gameData, updateGameData } = useGameData();
  
  const [battleState, setBattleState] = useState<TeamBattleState>(() => {
    const savedState = localStorage.getItem('teamBattleState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Partial<TeamBattleState>;
        return {
          playerPairs: Array.isArray(parsed.playerPairs) ? parsed.playerPairs : [],
          opponents: Array.isArray(parsed.opponents) ? parsed.opponents : [],
          currentTurn: parsed.currentTurn === 'enemy' || parsed.currentTurn === 'player' ? parsed.currentTurn : 'player',
          currentAttacker: typeof parsed.currentAttacker === 'number' ? parsed.currentAttacker : 0,
          level: typeof parsed.level === 'number' ? parsed.level : initialLevel,
          selectedDungeon: parsed.selectedDungeon ?? dungeonType
        };
      } catch {
        localStorage.removeItem('teamBattleState');
      }
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
        const heroCurrent = heroStats?.currentHealth ?? heroStats.health ?? 0;
        const dragonCurrent = pair.dragon ? (pair.dragon.currentHealth ?? pair.dragon.health ?? 0) : 0;
        const dragonAlive = pair.dragon ? (dragonCurrent > 0) : false;
        
        const heroMana = heroStats.magic ?? 0;
        const dragonMana = dragonAlive ? (pair.dragon?.magic ?? 0) : 0;
        const totalMana = heroMana + dragonMana;
        
        return {
          id: `pair-${index}`,
          hero: pair.hero,
          dragon: pair.dragon,
          health: heroCurrent + dragonCurrent,
          maxHealth: (heroStats.health ?? 0) + (dragonStats.health ?? 0),
          power: (heroStats.power ?? 0) + (dragonAlive ? (dragonStats.power ?? 0) : 0),
          defense: (heroStats.defense ?? 0) + (dragonAlive ? (dragonStats.defense ?? 0) : 0),
          attackOrder: index + 1,
          mana: totalMana,
          maxMana: totalMana
        };
      });

      const opponents = generateDungeonOpponents(dungeonType, initialLevel);
      
      startTransition(() => {
        setBattleState(prev => ({
          ...prev,
          playerPairs: teamPairs,
          opponents,
          selectedDungeon: dungeonType
        }));
      });
      
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

  const executePlayerAttack = async (pairId: string, targetId: number) => {
    const attackingPair = battleState.playerPairs.find(p => p.id === pairId);
    const target = battleState.opponents.find(o => o.id === targetId);
    
    if (!attackingPair || !target) return;

    const damage = Math.max(1, attackingPair.power - (target.defense || 0));
    const newTargetHealth = Math.max(0, target.health - damage);

    startTransition(() => {
      setBattleState(prev => ({
        ...prev,
        opponents: prev.opponents.map(opp => 
          opp.id === targetId 
            ? { ...opp, health: newTargetHealth }
            : opp
        ).filter(opp => opp.health > 0)
      }));
    });

    // Добавляем опыт аккаунта за убийство монстра
    if (newTargetHealth <= 0) {
      const expReward = (accountLevel * 5) + 45 + (target.isBoss ? 150 : 0);
      
      await addAccountExp(expReward);
      
      toast({
        title: "Враг побежден!",
        description: `Получено ${expReward} опыта аккаунта`,
      });
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

  const executeCounterAttack = async (attackerId: string | number, targetId: string | number, isEnemyAttacker: boolean) => {
    if (isEnemyAttacker) {
      // Враг (в т.ч. босс) отвечает атакующей паре
      const enemy = battleState.opponents.find(o => o.id === attackerId);
      const pair = battleState.playerPairs.find(p => p.id === targetId);
      
      if (!enemy || !pair || pair.health <= 0) return;

      const damage = Math.max(1, enemy.power - pair.defense);
      
      // Apply damage using proper health logic
      const updatedPair = await applyDamageToPair(pair, damage, updateGameData, gameData);

      startTransition(() => {
        setBattleState(prev => ({
          ...prev,
          playerPairs: prev.playerPairs.map(p =>
            p.id === pair.id 
              ? updatedPair
              : p
          )
        }));
      });

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
        
        addAccountExp(expReward);
        
        toast({
          title: "Враг побежден!",
          description: `Получено ${expReward} опыта аккаунта`,
        });
      }

      toast({
        title: "Ответный удар!",
        description: `${pair.hero.name} наносит ${damage} урона в ответ!`,
      });
    }
    // Prevent auto-loop: do not chain new enemy attacks here.
    // Flow is controlled by the initiating function (player/enemy attack).
    const isActive = localStorage.getItem('activeBattleInProgress') === 'true';
    const alivePairs = battleState.playerPairs.filter(pair => pair.health > 0);
    const aliveOpponents = battleState.opponents.filter(opp => opp.health > 0);
    if (!isActive || aliveOpponents.length === 0 || alivePairs.length === 0) {
      return;
    }
  };
  
  const executeEnemyAttack = async () => {
    const isActive = localStorage.getItem('activeBattleInProgress') === 'true';
    if (!isActive || battleState.currentTurn !== 'enemy') return;

    const alivePairs = battleState.playerPairs.filter(pair => pair.health > 0);
    const aliveOpponents = battleState.opponents.filter(opp => opp.health > 0);
    
    if (aliveOpponents.length === 0 || alivePairs.length === 0) {
      if (alivePairs.length === 0) handleGameOver();
      return;
    }

    const currentEnemy = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
    const targetPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
    const damage = Math.max(1, currentEnemy.power - targetPair.defense);
    
    const updatedPair = await applyDamageToPair(targetPair, damage, updateGameData, gameData);

    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair =>
        pair.id === targetPair.id
          ? updatedPair
          : pair
      )
    }));

    toast({
      title: "Враг атакует!",
      description: `${currentEnemy.name} наносит ${damage} урона!`,
      variant: "destructive"
    });

    if (updatedPair.health > 0) {
      setTimeout(() => {
        executeCounterAttack(targetPair.id, currentEnemy.id, false);
      }, 800);
    }

    if (alivePairs.length === 1 && updatedPair.health === 0) {
      setTimeout(() => {
        handleGameOver();
      }, 1200);
    } else {
      setTimeout(() => {
        switchTurn();
      }, 1200);
    }
  };

  const executeAbilityUse = async (pairId: string, abilityId: string, target: string | number) => {
    try {
      const prevState = battleState;
      const isHealing = String(abilityId).toLowerCase().includes('heal');

      if (isHealing) {
        const targetPairId = typeof target === 'string' ? target : pairId;
        const targetPair = prevState.playerPairs.find(p => p.id === targetPairId);
        if (!targetPair) return;

        const heroMax = targetPair.hero?.health ?? 0;
        let heroCurrent = targetPair.hero?.currentHealth ?? heroMax;

        const dragonMax = targetPair.dragon?.health ?? 0;
        let dragonCurrent = targetPair.dragon ? (targetPair.dragon.currentHealth ?? dragonMax) : 0;

        const heroMagic = targetPair.hero?.magic ?? 0;
        const dragonMagic = targetPair.dragon?.magic ?? 0;

        let healLeft = Math.max(10, Math.floor((heroMagic + dragonMagic) * 0.5));
        const prevHealth = targetPair.health;

        if (targetPair.dragon) {
          const dragonHeal = Math.min(healLeft, Math.max(0, dragonMax - dragonCurrent));
          dragonCurrent += dragonHeal;
          healLeft -= dragonHeal;
        }

        if (healLeft > 0) {
          const heroHeal = Math.min(healLeft, Math.max(0, heroMax - heroCurrent));
          heroCurrent += heroHeal;
          healLeft -= heroHeal;
        }

        const newPair = {
          ...targetPair,
          hero: {
            ...targetPair.hero,
            currentHealth: Math.min(heroMax, heroCurrent),
          },
          dragon: targetPair.dragon
            ? {
                ...targetPair.dragon,
                currentHealth: Math.min(dragonMax, dragonCurrent),
              }
            : targetPair.dragon,
          health: Math.min(heroMax, heroCurrent) + (targetPair.dragon ? Math.min(dragonMax, dragonCurrent) : 0),
          mana: Math.max(0, targetPair.mana - 10),
        };

        setBattleState(prev => ({
          ...prev,
          playerPairs: prev.playerPairs.map(p => (p.id === targetPairId ? newPair : p)),
        }));

        const healedAmount = newPair.health - prevHealth;
        toast({
          title: "Исцеление применено!",
          description: `Восстановлено ${healedAmount} здоровья`,
        });

        setTimeout(() => {
          switchTurn();
        }, 800);
      } else {
        console.warn('executeAbilityUse: неподдерживаемая способность', abilityId);
        setTimeout(() => {
          switchTurn();
        }, 800);
      }
    } catch (error) {
      console.error('executeAbilityUse error:', error);
    }
  };

  const switchTurn = () => {
    setBattleState(prev => {
      const isActive = localStorage.getItem('activeBattleInProgress') === 'true';
      const aliveOpponents = prev.opponents.filter(o => o.health > 0).length;
      const alivePairs = prev.playerPairs.filter(p => p.health > 0).length;

      // If battle is not active or one side has no units alive, do not switch turn
      if (!isActive || aliveOpponents === 0 || alivePairs === 0) {
        return prev;
      }

      // Only switch to enemy turn if it's currently player turn
      // This prevents automatic enemy attacks from starting
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

    // Clear all timeouts and reset battle state immediately
    localStorage.removeItem('teamBattleState');
    localStorage.removeItem('activeBattleInProgress');
    
    startTransition(() => {
      setBattleState(prev => ({
        ...prev,
        currentTurn: 'player',
        currentAttacker: 0
      }));
    });
  };

  const resetBattle = () => {
    localStorage.removeItem('teamBattleState');
    localStorage.removeItem('activeBattleInProgress');
    startTransition(() => {
      setBattleState({
        playerPairs: [],
        opponents: [],
        currentTurn: 'player',
        currentAttacker: 0,
        level: 1,
        selectedDungeon: dungeonType
      });
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
    aliveOpponents: battleState.opponents.filter(opp => opp.health > 0),
    executeAbilityUse
  };
};