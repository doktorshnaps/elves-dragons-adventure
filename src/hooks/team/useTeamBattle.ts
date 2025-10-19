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
import { useCardInstances } from '@/hooks/useCardInstances';
import { calculateCardStats } from '@/utils/cardUtils';
import { calculateD6Damage } from '@/utils/battleCalculations';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  const { gameData, updateGameData } = useGameData();
  const { loading: cardInstancesLoading, incrementMonsterKills } = useCardInstances();
  
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
  const [lastRoll, setLastRoll] = useState<{ attackerRoll: number; defenderRoll: number; source: 'player' | 'enemy'; damage: number; isBlocked: boolean; isCritical?: boolean } | null>(null);

  // Initialize battle with team pairs
  useEffect(() => {
    if (cardInstancesLoading) return; // Wait until card instances are loaded to get accurate health
    
    // Check if we need to initialize playerPairs from selectedPairs
    const needsInit = selectedPairs.length > 0 && battleState.playerPairs.length === 0;
    const savedState = localStorage.getItem('teamBattleState');
    
    // If there's no saved state and we have selected pairs, initialize
    if (needsInit && !savedState) {
      const cardsArr = (gameData.cards as any[]) || [];
      const byId = new Map(cardsArr.map((c: any) => [c.id, c]));

      const teamPairs: TeamPair[] = selectedPairs.map((pair, index) => {
        const heroFromMap = byId.get(pair.hero.id) || pair.hero;
        const dragonFromMap = pair.dragon ? (byId.get(pair.dragon.id) || pair.dragon) : undefined;

        // Always recalculate stats to match Grimoire/Decks
        const heroRarity = Number(heroFromMap.rarity) as any;
        const heroCalc = calculateCardStats(heroFromMap.name, heroRarity, 'character');
        const heroMax = heroCalc.health;
        const heroCurrent = Math.min(heroFromMap.currentHealth ?? heroFromMap.health ?? heroMax, heroMax);

        const dragonCalc = dragonFromMap ? calculateCardStats(dragonFromMap.name, Number(dragonFromMap.rarity) as any, 'pet') : { power: 0, defense: 0, health: 0, magic: 0 };
        const dragonMax = dragonFromMap ? dragonCalc.health : 0;
        const dragonCurrent = dragonFromMap ? Math.min(dragonFromMap.currentHealth ?? dragonFromMap.health ?? dragonMax, dragonMax) : 0;
        const dragonAlive = !!dragonFromMap && (dragonCurrent > 0);

        const heroWithCalc = { ...heroFromMap, ...heroCalc, health: heroMax, currentHealth: heroCurrent };
        const dragonWithCalc = dragonFromMap ? { ...dragonFromMap, ...dragonCalc, health: dragonMax, currentHealth: dragonCurrent } : undefined;

        const heroMana = heroWithCalc.magic ?? 0;
        const dragonMana = dragonAlive ? (dragonWithCalc?.magic ?? 0) : 0;
        const totalMana = heroMana + dragonMana;
        
        // Расчет брони по ТЗ: Armor_pair = (Armor_d + Armor_h) / 2
        const heroArmor = heroWithCalc.defense ?? 0;
        const dragonArmor = dragonAlive ? (dragonWithCalc?.defense ?? 0) : 0;
        const pairArmor = dragonAlive 
          ? Math.floor((heroArmor + dragonArmor) / 2)
          : heroArmor;
        
        return {
          id: `pair-${index}`,
          hero: heroWithCalc,
          dragon: dragonWithCalc,
          health: heroCurrent + dragonCurrent,
          maxHealth: heroMax + (dragonMax || 0),
          power: (heroWithCalc.power ?? 0) + (dragonAlive ? (dragonWithCalc?.power ?? 0) : 0),
          defense: pairArmor,
          attackOrder: index + 1,
          mana: totalMana,
          maxMana: totalMana
        };
      });

      (async () => {
        const opponents = await generateDungeonOpponents(dungeonType, initialLevel);
        
        startTransition(() => {
          setBattleState(prev => ({
            ...prev,
            playerPairs: teamPairs,
            opponents,
            selectedDungeon: dungeonType
          }));
        });
        
        setAttackOrder(teamPairs.map(pair => pair.id));
      })();
    } else if (selectedPairs.length === 0 && !savedState && battleState.playerPairs.length === 0) {
      console.log('⚠️ No selected pairs available for battle initialization');
    }
  }, [selectedPairs, dungeonType, initialLevel, gameData.cards, cardInstancesLoading, battleState.playerPairs.length]);

  // Re-sync stats for existing saved battles to ensure new formula is used
  useEffect(() => {
    if (battleState.playerPairs.length === 0) return;
    const cardsArr = (gameData.cards as any[]) || [];
    const byId = new Map(cardsArr.map((c: any) => [c.id, c]));

    const resyncedPairs = battleState.playerPairs.map((pair, index) => {
      const heroSrc = byId.get(pair.hero.id) || pair.hero;
      const dragonSrc = pair.dragon ? (byId.get(pair.dragon.id) || pair.dragon) : undefined;

      const heroCalc = calculateCardStats(heroSrc.name, Number(heroSrc.rarity) as any, 'character');
      const heroMax = heroCalc.health;
      const heroCurrent = Math.min(pair.hero.currentHealth ?? pair.hero.health ?? heroMax, heroMax);

      const dragonCalc = dragonSrc ? calculateCardStats(dragonSrc.name, Number(dragonSrc.rarity) as any, 'pet') : { power: 0, defense: 0, health: 0, magic: 0 };
      const dragonMax = dragonSrc ? dragonCalc.health : 0;
      const dragonCurrent = dragonSrc ? Math.min((pair.dragon?.currentHealth ?? pair.dragon?.health ?? dragonMax), dragonMax) : 0;
      const dragonAlive = !!dragonSrc && (dragonCurrent > 0);

      const heroWithCalc = { ...pair.hero, ...heroCalc, health: heroMax, currentHealth: heroCurrent };
      const dragonWithCalc = dragonSrc ? { ...(pair.dragon as any), ...dragonCalc, health: dragonMax, currentHealth: dragonCurrent } : undefined;

      const heroMana = heroWithCalc.magic ?? 0;
      const dragonMana = dragonAlive ? (dragonWithCalc?.magic ?? 0) : 0;
      const totalMana = heroMana + dragonMana;

      // Расчет брони по ТЗ: Armor_pair = (Armor_d + Armor_h) / 2
      const heroArmor = heroWithCalc.defense ?? 0;
      const dragonArmor = dragonAlive ? (dragonWithCalc?.defense ?? 0) : 0;
      const pairArmor = dragonAlive 
        ? Math.floor((heroArmor + dragonArmor) / 2)
        : heroArmor;
      
      return {
        ...pair,
        hero: heroWithCalc,
        dragon: dragonWithCalc,
        health: heroCurrent + dragonCurrent,
        maxHealth: heroMax + (dragonMax || 0),
        power: (heroWithCalc.power ?? 0) + (dragonAlive ? (dragonWithCalc?.power ?? 0) : 0),
        defense: pairArmor,
        mana: totalMana,
        maxMana: totalMana
      };
    });

    setBattleState(prev => ({ ...prev, playerPairs: resyncedPairs }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameData.cards]);

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

  const [skippedAttackerIds, setSkippedAttackerIds] = useState<Set<string>>(new Set());

  const executePlayerAttack = async (pairId: string, targetId: number) => {
    const attackingPair = battleState.playerPairs.find(p => p.id === pairId);
    const target = battleState.opponents.find(o => o.id === targetId);
    
    if (!attackingPair || !target) return;

    // Проверяем, не пропускает ли атакующий ход
    if (skippedAttackerIds.has(pairId)) {
      toast({
        title: "Пропуск хода",
        description: `${attackingPair.hero.name} пропускает ход из-за критической блокировки врага`,
        variant: "destructive"
      });
      
      // Убираем из списка пропущенных
      setSkippedAttackerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pairId);
        return newSet;
      });
      
      // Переходим к следующему ходу
      setTimeout(() => {
        switchTurn();
      }, 1000);
      return;
    }

    const damageResult = calculateD6Damage(attackingPair.power, target.armor || 0);
    const appliedDamage = damageResult.attackerRoll > damageResult.defenderRoll ? damageResult.damage : 0;
    const isBlocked = damageResult.isDefenderCrit || damageResult.attackerRoll <= damageResult.defenderRoll;
    setLastRoll({ 
      attackerRoll: damageResult.attackerRoll, 
      defenderRoll: damageResult.defenderRoll, 
      source: 'player', 
      damage: appliedDamage, 
      isBlocked,
      isCritical: damageResult.isAttackerCrit && appliedDamage > 0
    });
    if (damageResult.damage > 0 && appliedDamage === 0) {
      console.warn("⚠️ Inconsistent damage prevented (player attack)", damageResult);
    }
    const newTargetHealth = Math.max(0, target.health - appliedDamage);

    console.log("🧮 Player attack result", {
      pair: attackingPair.id,
      target: target.id,
      rolls: { attacker: damageResult.attackerRoll, defender: damageResult.defenderRoll },
      damage: { raw: damageResult.damage, applied: appliedDamage },
      health: { before: target.health, after: newTargetHealth },
    });

    startTransition(() => {
      setBattleState(prev => ({
        ...prev,
        opponents: prev.opponents.map(opp => 
          opp.id === targetId 
            ? { ...opp, health: newTargetHealth, isDead: newTargetHealth <= 0 }
            : opp
        )
      }));
    });

    // Добавляем опыт аккаунта за убийство монстра и инкрементим убийства для пары
    if (newTargetHealth <= 0) {
      const expReward = (accountLevel * 5) + 45 + (target.isBoss ? 150 : 0);

      // Засчитываем убийство обеим карточкам пары-атакующего
      try {
        if (attackingPair.hero?.id) {
          const okHero = await incrementMonsterKills(attackingPair.hero.id, 1);
          console.log('🔢 incrementMonsterKills hero', attackingPair.hero.id, okHero);
        }
        if (attackingPair.dragon?.id) {
          const okDragon = await incrementMonsterKills(attackingPair.dragon.id, 1);
          console.log('🔢 incrementMonsterKills dragon', attackingPair.dragon.id, okDragon);
        }
      } catch (e) {
        console.warn('incrementMonsterKills error:', e);
      }
      
      await addAccountExp(expReward);
      
      toast({
        title: "Враг побежден!",
        description: `Получено ${expReward} опыта аккаунта`,
      });
    }

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️ БЛОК!" : "";
    const skipText = damageResult.skipNextTurn ? " (пропуск хода)" : "";
    
    toast({
      title: `Атака!${critText}${skipText}`,
      description: `${attackingPair.hero.name} бросил ${damageResult.attackerRoll}, враг ${damageResult.defenderRoll}. Урон: ${appliedDamage}${defCritText}`,
    });

    // Check if all enemies defeated
    if (battleState.opponents.filter(o => o.health > 0).length === 1 && newTargetHealth === 0) {
      // Level cleared — do not auto-advance. Let UI decide via reward modal.
      localStorage.setItem('activeBattleInProgress', 'false');
      // Do not call handleLevelComplete here and do not switch turn
    } else {
      // Switch to next attacker or enemy turn
      setTimeout(() => {
        switchTurn();
      }, 3000);
    }
  };

  // УБРАНА механика ответного удара (executeCounterAttack)
  
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
    
    const damageResult = calculateD6Damage(currentEnemy.power, targetPair.defense);
    const appliedDamage = damageResult.attackerRoll > damageResult.defenderRoll ? damageResult.damage : 0;
    const isBlocked = damageResult.isDefenderCrit || damageResult.attackerRoll <= damageResult.defenderRoll;
    setLastRoll({ 
      attackerRoll: damageResult.attackerRoll, 
      defenderRoll: damageResult.defenderRoll, 
      source: 'enemy', 
      damage: appliedDamage, 
      isBlocked,
      isCritical: damageResult.isAttackerCrit && appliedDamage > 0
    });
    // Если защитник выкинул критическую защиту (6), враг пропускает следующий ход
    if (damageResult.skipNextTurn) {
      setSkippedAttackerIds(prev => {
        const newSet = new Set(prev);
        newSet.add(`enemy-${currentEnemy.id}`);
        return newSet;
      });
    }
    
    if (damageResult.damage > 0 && appliedDamage === 0) {
      console.warn("⚠️ Inconsistent damage prevented (enemy attack)", damageResult);
    }
    
    const updatedPair = await applyDamageToPair(targetPair, appliedDamage, updateGameData, gameData);

    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair =>
        pair.id === targetPair.id
          ? updatedPair
          : pair
      )
    }));

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️ БЛОК!" : "";
    const skipText = damageResult.skipNextTurn ? " (враг пропустит ход)" : "";
    
    toast({
      title: `Враг атакует!${critText}${skipText}`,
      description: `${currentEnemy.name} бросил ${damageResult.attackerRoll}, пара ${damageResult.defenderRoll}. Урон: ${appliedDamage}${defCritText}`,
      variant: "destructive"
    });

    // УБРАНА механика ответного удара

    if (alivePairs.length === 1 && updatedPair.health === 0) {
      setTimeout(() => {
        handleGameOver();
      }, 3000);
    } else {
      setTimeout(() => {
        switchTurn();
      }, 3000);
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
  const handleLevelComplete = async () => {
    toast({
      title: "Уровень завершен!",
      description: "Переход на следующий уровень...",
    });

    const nextLevel = battleState.level + 1;
    const newOpponents = await generateDungeonOpponents(dungeonType, nextLevel);

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
      setBattleState(prev => ({
        ...prev,
        opponents: [],
        currentTurn: 'player',
        currentAttacker: 0,
        level: 1,
        selectedDungeon: dungeonType
      }));
    });
  };

  return {
    battleState,
    attackOrder,
    updateAttackOrder,
    executePlayerAttack,
    executeEnemyAttack,
    resetBattle,
    handleLevelComplete,
    isPlayerTurn: battleState.currentTurn === 'player',
    alivePairs: battleState.playerPairs.filter(pair => pair.health > 0),
    aliveOpponents: battleState.opponents.filter(opp => opp.health > 0),
    executeAbilityUse,
    lastRoll
  };
};