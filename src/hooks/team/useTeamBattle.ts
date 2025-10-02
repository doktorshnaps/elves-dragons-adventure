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
import { useCardInstances } from '@/hooks/useCardInstances';
import { calculateCardStats } from '@/utils/cardUtils';
import { calculateD6Damage } from '@/utils/battleCalculations';
import { applyFatigueDamage, getFatigueDescription } from '@/utils/expeditionFatigue';
import { applyCrowdModifiers } from '@/utils/crowdEffects';
import { getDungeonNumber } from '@/utils/monsterPowerIndex';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  const { gameData, updateGameData } = useGameData();
  const { loading: cardInstancesLoading } = useCardInstances();
  
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
    if (cardInstancesLoading) return; // Wait until card instances are loaded to get accurate health
    if (selectedPairs.length > 0 && battleState.playerPairs.length === 0) {
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
    }
  }, [selectedPairs, dungeonType, initialLevel, gameData.cards, cardInstancesLoading]);

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

  const executePlayerAttack = async (pairId: string, targetId: number) => {
    const attackingPair = battleState.playerPairs.find(p => p.id === pairId);
    const target = battleState.opponents.find(o => o.id === targetId);
    
    if (!attackingPair || !target) return;

    // Применяем модификаторы толпы
    const aliveOpponents = battleState.opponents.filter(o => o.health > 0).length;
    const dungeonNumber = getDungeonNumber(battleState.selectedDungeon || 'forgotten_souls');
    const playerMods = applyCrowdModifiers(
      attackingPair.defense,
      attackingPair.power,
      1, // allyCount для игрока
      aliveOpponents,
      dungeonNumber,
      true // isPlayer
    );
    
    // Используем систему d6 с учетом модификаторов
    const damageResult = calculateD6Damage(playerMods.effectiveAttack, target.armor || 0);
    const newTargetHealth = Math.max(0, target.health - damageResult.damage);

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

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️" : "";
    
    toast({
      title: `Атака!${critText}`,
      description: `${attackingPair.hero.name} (${damageResult.attackerRoll}+${attackingPair.power}) наносит ${damageResult.damage} урона${defCritText}`,
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

      // Применяем модификаторы толпы для врага
      const aliveOpponents = battleState.opponents.filter(o => o.health > 0).length;
      const alivePairs = battleState.playerPairs.filter(p => p.health > 0).length;
      const dungeonNumber = getDungeonNumber(battleState.selectedDungeon || 'forgotten_souls');
      
      const enemyMods = applyCrowdModifiers(
        enemy.armor || 0,
        enemy.power,
        aliveOpponents,
        alivePairs,
        dungeonNumber,
        false // isEnemy
      );
      
      const playerMods = applyCrowdModifiers(
        pair.defense,
        pair.power,
        alivePairs,
        aliveOpponents,
        dungeonNumber,
        true // isPlayer
      );

      // Используем систему d6 с учетом модификаторов
      const damageResult = calculateD6Damage(enemyMods.effectiveAttack, playerMods.effectiveArmor);
      
      // Применяем усталость похода к входящему урону
      const finalDamage = applyFatigueDamage(damageResult.damage, battleState.level);
      
      // Apply damage using proper health logic
      const updatedPair = await applyDamageToPair(pair, finalDamage, updateGameData, gameData);

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

      const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
      const defCritText = damageResult.isDefenderCrit ? " 🛡️" : "";
      const fatigueInfo = getFatigueDescription(battleState.level);
      const damageInfo = finalDamage > damageResult.damage 
        ? `${damageResult.damage}→${finalDamage}` 
        : `${finalDamage}`;
      
      toast({
        title: `Ответный удар врага!${critText}`,
        description: `${enemy.name} (${damageResult.attackerRoll}+${enemy.power}) наносит ${damageInfo} урона${defCritText}${fatigueInfo ? '\n' + fatigueInfo : ''}`,
        variant: "destructive"
      });
    } else {
      // Пара отвечает врагу
      const pair = battleState.playerPairs.find(p => p.id === attackerId);
      const enemy = battleState.opponents.find(o => o.id === targetId);
      
      if (!pair || !enemy || enemy.health <= 0) return;

      // Применяем модификаторы толпы для контратаки
      const aliveOpponents = battleState.opponents.filter(o => o.health > 0).length;
      const dungeonNumber = getDungeonNumber(battleState.selectedDungeon || 'forgotten_souls');
      const playerMods = applyCrowdModifiers(
        pair.defense,
        pair.power,
        1,
        aliveOpponents,
        dungeonNumber,
        true
      );

      // Используем систему d6 с учетом модификаторов для ответного удара пары
      const damageResult = calculateD6Damage(playerMods.effectiveAttack, enemy.armor || 0);
      const damage = damageResult.damage;
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

      const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
      
      toast({
        title: `Ответный удар!${critText}`,
        description: `${pair.hero.name} (${damageResult.attackerRoll}+${pair.power}) наносит ${damage} урона в ответ!`,
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
    
    // Применяем модификаторы толпы для врага
    const dungeonNumber = getDungeonNumber(battleState.selectedDungeon || 'forgotten_souls');
    const enemyMods = applyCrowdModifiers(
      currentEnemy.armor || 0,
      currentEnemy.power,
      aliveOpponents.length,
      alivePairs.length,
      dungeonNumber,
      false
    );
    
    const playerMods = applyCrowdModifiers(
      targetPair.defense,
      targetPair.power,
      alivePairs.length,
      aliveOpponents.length,
      dungeonNumber,
      true
    );
    
    // Используем систему d6 с учетом модификаторов для атаки врага
    const damageResult = calculateD6Damage(enemyMods.effectiveAttack, playerMods.effectiveArmor);
    
    // Применяем усталость похода к входящему урону
    const finalDamage = applyFatigueDamage(damageResult.damage, battleState.level);
    
    const updatedPair = await applyDamageToPair(targetPair, finalDamage, updateGameData, gameData);

    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair =>
        pair.id === targetPair.id
          ? updatedPair
          : pair
      )
    }));

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️" : "";
    const fatigueInfo = getFatigueDescription(battleState.level);
    const damageInfo = finalDamage > damageResult.damage 
      ? `${damageResult.damage}→${finalDamage}` 
      : `${finalDamage}`;
    
    toast({
      title: `Враг атакует!${critText}`,
      description: `${currentEnemy.name} (${damageResult.attackerRoll}+${currentEnemy.power}) наносит ${damageInfo} урона${defCritText}${fatigueInfo ? '\n' + fatigueInfo : ''}`,
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
    executeCounterAttack,
    resetBattle,
    handleLevelComplete,
    isPlayerTurn: battleState.currentTurn === 'player',
    alivePairs: battleState.playerPairs.filter(pair => pair.health > 0),
    aliveOpponents: battleState.opponents.filter(opp => opp.health > 0),
    executeAbilityUse
  };
};