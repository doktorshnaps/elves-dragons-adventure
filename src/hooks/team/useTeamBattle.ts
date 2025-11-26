import { useState, useEffect, useCallback, startTransition, useRef } from 'react';
import { TeamPair, TeamBattleState, BattleAction } from '@/types/teamBattle';
import { useToast } from '@/hooks/use-toast';
import { generateDungeonOpponents } from '@/dungeons/dungeonManager';
import { DungeonType, canGainExperienceInDungeon } from '@/constants/dungeons';
import { useTeamSelection } from './useTeamSelection';
import { addAccountExperience, getLevelFromXP } from '@/utils/accountLeveling';
import { useGameStore } from '@/stores/gameStore';
import { applyDamageToPair } from '@/utils/battleHealthUtils';
import { useGameData } from '@/hooks/useGameData';
import { useCardInstancesContext } from '@/providers/CardInstancesProvider';
import { calculateD6Damage } from '@/utils/battleCalculations';
import { useBattleSpeed } from '@/contexts/BattleSpeedContext';

export const useTeamBattle = (dungeonType: DungeonType, initialLevel: number = 1) => {
  const { toast } = useToast();
  const { selectedPairs, getSelectedTeamStats } = useTeamSelection();
  const { accountLevel, accountExperience, addAccountExperience: addAccountExp } = useGameStore();
  const { gameData, updateGameData } = useGameData();
  const { loading: cardInstancesLoading, cardInstances, incrementMonsterKills } = useCardInstancesContext();
  const { adjustDelay } = useBattleSpeed();
  
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
  const [lastRoll, setLastRoll] = useState<{ attackerRoll: number; defenderRoll: number; source: 'player' | 'enemy'; damage: number; isBlocked: boolean; isCritical?: boolean; level: number } | null>(null);

  // Тайминги последовательности боя (синхронизированы с UI анимациями)
  const DICE_ROLL_MS = 1500; // кубики крутятся
  const ATTACK_ANIMATION_MS = 2000; // анимация атаки
  const TURN_DELAY_MS = 1000; // пауза перед сменой хода
  const delay = (ms: number) => new Promise<void>((res) => setTimeout(res, adjustDelay(ms)));

  // Блокировка повторных вызовов атаки врага (анти-дубль при лагах)
  const enemyAttackLockRef = useRef(false);

  // Initialize battle with team pairs
  useEffect(() => {
    if (cardInstancesLoading) return; // Wait until card instances are loaded to get accurate health
    if (selectedPairs.length > 0 && battleState.playerPairs.length === 0) {
      const cardsArr = (gameData.cards as any[]) || [];
      const byId = new Map(cardsArr.map((c: any) => [c.id, c]));

      const teamPairs: TeamPair[] = selectedPairs.map((pair, index) => {
        console.log(`🎯 [useTeamBattle] Building pair ${index} from card_instances context`);
        
        // КРИТИЧНО: берем характеристики из card_instances по UUID
        const heroLookupId = pair.hero.instanceId || pair.hero.id;
        const heroInstance = cardInstances.find(ci => ci.id === heroLookupId);
        
        const dragonLookupId = pair.dragon?.instanceId || pair.dragon?.id;
        const dragonInstance = pair.dragon ? cardInstances.find(ci => ci.id === dragonLookupId) : undefined;
        
        if (!heroInstance) {
          console.error(`❌ Hero instance not found for ${pair.hero.name} (id: ${pair.hero.id})`);
        }
        
        // Hero data from card_instances
        const heroData = heroInstance?.card_data as any;
        const heroPower = heroData?.power ?? pair.hero.power ?? 0;
        const heroDefense = heroInstance?.max_defense ?? pair.hero.defense ?? 0;
        const heroHealth = heroInstance?.max_health ?? pair.hero.health ?? 0;
        const heroMagic = heroData?.magic ?? pair.hero.magic ?? 0;
        const heroCurrent = heroInstance?.current_health ?? pair.hero.currentHealth ?? heroHealth;
        const heroCurrentDefense = heroInstance?.current_defense ?? heroDefense;
        const heroMaxDefense = heroInstance?.max_defense ?? heroDefense;
        
        console.log(`  Hero "${pair.hero.name}":`, { 
          power: heroPower, 
          defense: heroDefense, 
          currentDefense: heroCurrentDefense,
          maxDefense: heroMaxDefense,
          health: heroHealth, 
          currentHealth: heroCurrent,
          magic: heroMagic 
        });
        
        // Dragon data from card_instances (if exists)
        const dragonData = dragonInstance?.card_data as any;
        const dragonPower = dragonData?.power ?? pair.dragon?.power ?? 0;
        const dragonDefense = dragonInstance?.max_defense ?? pair.dragon?.defense ?? 0;
        const dragonHealth = dragonInstance?.max_health ?? pair.dragon?.health ?? 0;
        const dragonMagic = dragonData?.magic ?? pair.dragon?.magic ?? 0;
        const dragonCurrent = dragonInstance?.current_health ?? pair.dragon?.currentHealth ?? dragonHealth;
        const dragonCurrentDefense = dragonInstance?.current_defense ?? dragonDefense;
        const dragonMaxDefense = dragonInstance?.max_defense ?? dragonDefense;
        const dragonAlive = !!pair.dragon && (dragonCurrent > 0);
        
        if (pair.dragon) {
          console.log(`  Dragon "${pair.dragon.name}":`, { 
            power: dragonPower, 
            defense: dragonDefense,
            currentDefense: dragonCurrentDefense,
            maxDefense: dragonMaxDefense,
            health: dragonHealth, 
            currentHealth: dragonCurrent,
            magic: dragonMagic,
            alive: dragonAlive
          });
        }
        
        const totalMana = heroMagic + (dragonAlive ? dragonMagic : 0);
        const pairCurrentDefense = heroCurrentDefense + (dragonAlive ? dragonCurrentDefense : 0);
        const pairMaxDefense = heroMaxDefense + (dragonAlive ? dragonMaxDefense : 0);
        
        return {
          id: `pair-${index}`,
          hero: {
            ...pair.hero,
            power: heroPower,
            defense: heroDefense,
            health: heroHealth,
            magic: heroMagic,
            currentHealth: heroCurrent,
            currentDefense: heroCurrentDefense,
            maxDefense: heroMaxDefense
          },
          dragon: pair.dragon ? {
            ...pair.dragon,
            power: dragonPower,
            defense: dragonDefense,
            health: dragonHealth,
            magic: dragonMagic,
            currentHealth: dragonCurrent,
            currentDefense: dragonCurrentDefense,
            maxDefense: dragonMaxDefense
          } : undefined,
          health: heroCurrent + (dragonAlive ? dragonCurrent : 0),
          maxHealth: heroHealth + (dragonAlive ? dragonHealth : 0),
          power: heroPower + (dragonAlive ? dragonPower : 0),
          defense: heroDefense + (dragonAlive ? dragonDefense : 0),
          currentDefense: pairCurrentDefense,
          maxDefense: pairMaxDefense,
          attackOrder: index + 1,
          mana: totalMana,
          maxMana: totalMana
        };
      });

      (async () => {
        // Предзагружаем treasure hunt событие в кеш ДО начала боя (оптимизация Phase 2A)
        const { loadActiveTreasureHunt } = await import('@/utils/monsterLootMapping');
        loadActiveTreasureHunt().then(() => {
          console.log('🎁 [INIT] Treasure hunt cache preloaded before battle');
        }).catch(() => {
          console.log('ℹ️ [INIT] No active treasure hunt event');
        });
        
        const opponents = await generateDungeonOpponents(dungeonType, initialLevel);
        
        // Устанавливаем флаг активного боя при инициализации
        localStorage.setItem('activeBattleInProgress', 'true');
        console.log('🎬 [INIT] Starting battle, setting activeBattleInProgress=true');
        
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
  }, [selectedPairs, dungeonType, initialLevel, gameData.cards, cardInstancesLoading, cardInstances]);

  // Re-sync stats from card_instances when they change
  // КРИТИЧНО: НЕ синхронизировать во время активного боя, чтобы не перезаписать локальный урон
  useEffect(() => {
    if (battleState.playerPairs.length === 0) return;
    if (cardInstancesLoading) return;
    
    // Проверяем, идет ли активный бой
    const activeBattle = localStorage.getItem('activeBattleInProgress') === 'true';
    if (activeBattle && battleState.opponents.length > 0) {
      console.log('⏸️ [useTeamBattle] Skipping re-sync during active battle to preserve local damage state');
      return;
    }
    
    console.log('🔄 [useTeamBattle] Re-syncing battle pairs with card_instances');

    const resyncedPairs = battleState.playerPairs.map((pair, index) => {
      // КРИТИЧНО: берем характеристики из card_instances по UUID
      const heroLookupId = pair.hero.instanceId || pair.hero.id;
      const heroInstance = cardInstances.find(ci => ci.id === heroLookupId);
      
      const dragonLookupId = pair.dragon?.instanceId || pair.dragon?.id;
      const dragonInstance = pair.dragon ? cardInstances.find(ci => ci.id === dragonLookupId) : undefined;
      
      // Hero data
      const heroData = heroInstance?.card_data as any;
      const heroPower = heroData?.power ?? pair.hero.power ?? 0;
      const heroDefense = heroInstance?.max_defense ?? pair.hero.defense ?? 0;
      const heroHealth = heroInstance?.max_health ?? pair.hero.health ?? 0;
      const heroMagic = heroData?.magic ?? pair.hero.magic ?? 0;
      const heroCurrent = heroInstance?.current_health ?? pair.hero.currentHealth ?? heroHealth;
      const heroCurrentDefense = heroInstance?.current_defense ?? heroDefense;
      const heroMaxDefense = heroInstance?.max_defense ?? heroDefense;
      
      // Dragon data
      const dragonData = dragonInstance?.card_data as any;
      const dragonPower = dragonData?.power ?? pair.dragon?.power ?? 0;
      const dragonDefense = dragonInstance?.max_defense ?? pair.dragon?.defense ?? 0;
      const dragonHealth = dragonInstance?.max_health ?? pair.dragon?.health ?? 0;
      const dragonMagic = dragonData?.magic ?? pair.dragon?.magic ?? 0;
      const dragonCurrent = dragonInstance?.current_health ?? pair.dragon?.currentHealth ?? dragonHealth;
      const dragonCurrentDefense = dragonInstance?.current_defense ?? dragonDefense;
      const dragonMaxDefense = dragonInstance?.max_defense ?? dragonDefense;
      const dragonAlive = !!pair.dragon && (dragonCurrent > 0);

      const totalMana = heroMagic + (dragonAlive ? dragonMagic : 0);
      const pairCurrentDefense = heroCurrentDefense + (dragonAlive ? dragonCurrentDefense : 0);
      const pairMaxDefense = heroMaxDefense + (dragonAlive ? dragonMaxDefense : 0);
      
      return {
        ...pair,
        hero: {
          ...pair.hero,
          power: heroPower,
          defense: heroDefense,
          health: heroHealth,
          magic: heroMagic,
          currentHealth: heroCurrent,
          currentDefense: heroCurrentDefense,
          maxDefense: heroMaxDefense
        },
        dragon: pair.dragon ? {
          ...pair.dragon,
          power: dragonPower,
          defense: dragonDefense,
          health: dragonHealth,
          magic: dragonMagic,
          currentHealth: dragonCurrent,
          currentDefense: dragonCurrentDefense,
          maxDefense: dragonMaxDefense
        } : undefined,
        health: heroCurrent + (dragonAlive ? dragonCurrent : 0),
        maxHealth: heroHealth + (dragonAlive ? dragonHealth : 0),
        power: heroPower + (dragonAlive ? dragonPower : 0),
        defense: heroDefense + (dragonAlive ? dragonDefense : 0),
        currentDefense: pairCurrentDefense,
        maxDefense: pairMaxDefense,
        mana: totalMana,
        maxMana: totalMana
      };
    });

    setBattleState(prev => ({ ...prev, playerPairs: resyncedPairs }));
  }, [cardInstances, cardInstancesLoading]);

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
    const turnStartTime = Date.now();
    console.log(`🎲 [PLAYER] НАЧАЛО БРОСКА КУБИКА (${new Date().toISOString()})`);
    
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
      setSkippedAttackerIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pairId);
        return newSet;
      });
      setTimeout(() => switchTurn(), adjustDelay(TURN_DELAY_MS));
      return;
    }

    // Расчет результата броска и будущего урона (без немедленного применения)
    const damageResult = calculateD6Damage(attackingPair.power, target.armor || 0);
    const appliedDamage = damageResult.attackerRoll > damageResult.defenderRoll ? damageResult.damage : 0;
    const isBlocked = damageResult.isDefenderCrit || damageResult.attackerRoll <= damageResult.defenderRoll;

    console.log(`✅ [PLAYER] БРОСОК ЗАВЕРШЕН: result=${damageResult.attackerRoll}vs${damageResult.defenderRoll}, damage=${appliedDamage} (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);

    // Публикуем результат броска (UI сам покажет результаты и запустит анимацию)
    setLastRoll({
      attackerRoll: damageResult.attackerRoll,
      defenderRoll: damageResult.defenderRoll,
      source: 'player',
      damage: appliedDamage,
      isBlocked,
      isCritical: damageResult.isAttackerCrit && appliedDamage > 0,
      level: battleState.level
    });

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️ БЛОК!" : "";
    const skipText = damageResult.skipNextTurn ? " (пропуск хода)" : "";
    toast({
      title: `Атака!${critText}${skipText}`,
      description: `${attackingPair.hero.name} бросил ${damageResult.attackerRoll}, враг ${damageResult.defenderRoll}. Потенциальный урон: ${appliedDamage}${defCritText}`,
    });

    // Ждем: показ результата + анимация атаки
    console.log(`💥 [PLAYER] НАЧАЛО АНИМАЦИИ АТАКИ (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);
    await delay(DICE_ROLL_MS + ATTACK_ANIMATION_MS);

    // Применяем урон после завершения анимации
    const newTargetHealth = Math.max(0, target.health - appliedDamage);
    console.log(`⚔️ [PLAYER] НАНЕСЕНИЕ УРОНА: damage=${appliedDamage}, health=${target.health}→${newTargetHealth} (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);

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

    // Награды/опыт если цель убита
    if (newTargetHealth <= 0) {
      const expReward = (accountLevel * 5) + 45 + (target.isBoss ? 150 : 0);
      
      // ⚠️ ОПТИМИЗАЦИЯ PHASE 2A: НЕ отправляем запросы в БД во время боя!
      // Счетчики убийств будут обновлены один раз через claim-battle-rewards при выходе из подземелья
      console.log('💀 [BATTLE] Monster killed, kills will be synced on dungeon exit via claim-battle-rewards');
      
      // Проверяем, может ли игрок получить опыт в этом подземелье
      const canGainExp = canGainExperienceInDungeon(dungeonType, accountLevel);
      
      if (canGainExp && accountLevel < 100) {
        await addAccountExp(expReward);
        toast({ title: "Враг побежден!", description: `Получено ${expReward} опыта аккаунта` });
      } else if (accountLevel >= 100) {
        toast({ title: "Враг побежден!", description: "Достигнут максимальный уровень!" });
      } else {
        toast({ 
          title: "Враг побежден!", 
          description: "Для получения опыта нужно другое подземелье!",
          variant: "default"
        });
      }
    }

    console.log(`✅ [PLAYER] ХОД ЗАВЕРШЕН (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);

    // Проверяем завершение уровня
    if (battleState.opponents.filter(o => o.health > 0).length === 1 && newTargetHealth === 0) {
      // НЕ сбрасываем activeBattleInProgress - бой продолжается на следующем уровне
      // Флаг будет сброшен только при полном выходе из подземелья
      console.log('🏁 [PLAYER] Уровень завершен, сохраняем activeBattleInProgress=true для следующего уровня');
    } else {
      // Смена хода после короткой паузы
      setTimeout(() => switchTurn(), adjustDelay(TURN_DELAY_MS));
    }
  };

  // УБРАНА механика ответного удара (executeCounterAttack)
  
  const executeEnemyAttack = useCallback(async () => {
    const turnStartTime = Date.now();
    console.log(`🎲 [ENEMY] НАЧАЛО БРОСКА КУБИКА (${new Date().toISOString()})`);
    console.log('🔴 executeEnemyAttack called, currentTurn:', battleState.currentTurn);
    
    if (battleState.currentTurn !== 'enemy') {
      console.log('⚠️ Skipping enemy attack - not enemy turn');
      return;
    }
    
    // Анти-дубль: если атака врага уже запущена, игнорируем повтор
    if (enemyAttackLockRef.current) {
      console.log('⏳ Enemy attack in progress, skipping duplicate');
      return;
    }
    enemyAttackLockRef.current = true;

    const alivePairs = battleState.playerPairs.filter(pair => pair.health > 0);
    const aliveOpponents = battleState.opponents.filter(opp => opp.health > 0);
    console.log('⚔️ Enemy attacking - alivePairs:', alivePairs.length, 'aliveOpponents:', aliveOpponents.length);
    
    if (aliveOpponents.length === 0 || alivePairs.length === 0) {
      if (alivePairs.length === 0) handleGameOver();
      enemyAttackLockRef.current = false;
      return;
    }

    const currentEnemy = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)];
    const targetPair = alivePairs[Math.floor(Math.random() * alivePairs.length)];
    console.log('🎯 Enemy target:', currentEnemy.name, '→', targetPair.hero?.name || targetPair.dragon?.name);

    // Расчет результата броска (без немедленного урона)
    const damageResult = calculateD6Damage(currentEnemy.power, targetPair.defense);
    const appliedDamage = damageResult.attackerRoll > damageResult.defenderRoll ? damageResult.damage : 0;
    const isBlocked = damageResult.isDefenderCrit || damageResult.attackerRoll <= damageResult.defenderRoll;

    console.log(`✅ [ENEMY] БРОСОК ЗАВЕРШЕН: result=${damageResult.attackerRoll}vs${damageResult.defenderRoll}, damage=${appliedDamage} (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);

    // Публикуем результат броска (UI сам покажет результаты и анимацию)
    setLastRoll({
      attackerRoll: damageResult.attackerRoll,
      defenderRoll: damageResult.defenderRoll,
      source: 'enemy',
      damage: appliedDamage,
      isBlocked,
      isCritical: damageResult.isAttackerCrit && appliedDamage > 0,
      level: battleState.level
    });

    // Крит-блокировка врага: отметим пропуск следующего хода
    if (damageResult.skipNextTurn) {
      setSkippedAttackerIds(prev => {
        const newSet = new Set(prev);
        newSet.add(`enemy-${currentEnemy.id}`);
        return newSet;
      });
    }

    const critText = damageResult.isAttackerCrit ? " 🎯 КРИТ!" : "";
    const defCritText = damageResult.isDefenderCrit ? " 🛡️ БЛОК!" : "";
    const skipText = damageResult.skipNextTurn ? " (враг пропустит ход)" : "";
    toast({
      title: `Враг атакует!${critText}${skipText}`,
      description: `${currentEnemy.name} бросил ${damageResult.attackerRoll}, пара ${damageResult.defenderRoll}. Потенциальный урон: ${appliedDamage}${defCritText}`,
      variant: "destructive"
    });

    // Ждем: показ результата + анимация атаки
    console.log(`💥 [ENEMY] НАЧАЛО АНИМАЦИИ АТАКИ (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);
    await delay(DICE_ROLL_MS + ATTACK_ANIMATION_MS);

    // Применяем урон
    console.log(`⚔️ [ENEMY] НАНЕСЕНИЕ УРОНА: damage=${appliedDamage}, targetPair=${targetPair.id} (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);
    const updatedPair = await applyDamageToPair(targetPair, appliedDamage, updateGameData, gameData);

    setBattleState(prev => ({
      ...prev,
      playerPairs: prev.playerPairs.map(pair =>
        pair.id === targetPair.id
          ? updatedPair
          : pair
      )
    }));

    console.log(`✅ [ENEMY] ХОД ЗАВЕРШЕН (${Date.now() - turnStartTime}ms, ${new Date().toISOString()})`);

    // Финализация: смена хода или конец игры
    if (alivePairs.length === 1 && updatedPair.health === 0) {
      setTimeout(() => {
        enemyAttackLockRef.current = false;
        handleGameOver();
      }, adjustDelay(TURN_DELAY_MS));
    } else {
      setTimeout(() => {
        enemyAttackLockRef.current = false;
        switchTurn();
      }, adjustDelay(TURN_DELAY_MS));
    }
  }, [battleState, gameData, updateGameData, toast, adjustDelay]);

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
        }, adjustDelay(800));
      } else {
        console.warn('executeAbilityUse: неподдерживаемая способность', abilityId);
        setTimeout(() => {
          switchTurn();
        }, adjustDelay(800));
      }
    } catch (error) {
      console.error('executeAbilityUse error:', error);
    }
  };

  const switchTurn = () => {
    setBattleState(prev => {
      console.log('🔄 switchTurn called, currentTurn:', prev.currentTurn);
      const aliveOpponents = prev.opponents.filter(o => o.health > 0).length;
      const alivePairs = prev.playerPairs.filter(p => p.health > 0).length;

      // If one side has no units alive, do not switch turn
      if (aliveOpponents === 0 || alivePairs === 0) {
        console.log('⚠️ Not switching turn - aliveOpponents:', aliveOpponents, 'alivePairs:', alivePairs);
        return prev;
      }

      // Only switch to enemy turn if it's currently player turn
      // This prevents automatic enemy attacks from starting
      if (prev.currentTurn === 'player') {
        console.log('✅ Switching from player to enemy turn');
        return {
          ...prev,
          currentTurn: 'enemy',
          currentAttacker: 0
        };
      } else {
        const nextIndex = alivePairs > 0 ? (prev.currentAttacker + 1) % alivePairs : 0;
        console.log('✅ Switching from enemy to player turn, nextAttacker:', nextIndex);
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

    // Очищаем lastRoll при переходе на следующий уровень
    setLastRoll(null);

    // КРИТИЧНО: Сохраняем флаг activeBattleInProgress для предотвращения ре-синхронизации при переходе между уровнями
    localStorage.setItem('activeBattleInProgress', 'true');
    console.log('🔄 [LEVEL COMPLETE] Переход на уровень', nextLevel, 'сохраняем activeBattleInProgress=true');

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