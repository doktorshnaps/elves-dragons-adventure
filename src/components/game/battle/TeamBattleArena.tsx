import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Sword, Shield, Heart, ArrowLeft, Zap, FastForward } from 'lucide-react';
import { TeamPair } from '@/types/teamBattle';
import { Opponent } from '@/types/battle';
import { useGameStore } from '@/stores/gameStore';
import { getXPProgress } from '@/utils/accountLeveling';
import { useNavigate } from 'react-router-dom';
import { TeamHealthBars } from './TeamHealthBars';
import { InlineDiceDisplay } from './InlineDiceDisplay';
import { AttackAnimation } from './AttackAnimation';
import { DamageIndicator } from './DamageIndicator';
import { useDungeonSync } from '@/hooks/useDungeonSync';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { getTranslatedCardName } from '@/utils/cardNameTranslations';
import { useBattleSpeed } from '@/contexts/BattleSpeedContext';
import { resolveCardImageSync } from '@/utils/cardImageResolver';
import { PvPRollHistory, RollHistoryEntry } from '@/components/game/pvp/PvPRollHistory';
import { getDicePercentage } from '@/utils/diceFormula';
interface TeamBattleArenaProps {
  playerPairs: TeamPair[];
  opponents: Opponent[];
  attackOrder: string[];
  isPlayerTurn: boolean;
  onAttack: (pairId: string, targetId: number) => void;
  onAbilityUse?: (pairId: string, abilityId: string, targetId: number | string) => void;
  onEnemyAttack: () => void;
  level: number;
  lastRoll?: { attackerRoll: number; defenderRoll?: number; source: 'player' | 'enemy'; damage: number; isBlocked: boolean; isCritical?: boolean; isMiss?: boolean; isCounterAttack?: boolean; counterAttackDamage?: number; level: number } | null;
  onSurrenderWithSave?: () => Promise<void>;
  onMenuReturn?: () => void;
  dungeonType?: string;
  monstersKilledRef?: React.MutableRefObject<Array<{level: number, dungeonType: string, name?: string}>>;
  onQuickBattle?: () => void;
  hasGoldenTicket?: boolean;
}
export const TeamBattleArena: React.FC<TeamBattleArenaProps> = ({
  playerPairs,
  opponents,
  attackOrder,
  isPlayerTurn,
  onAttack,
  onAbilityUse,
  onEnemyAttack,
  level,
  lastRoll,
  onSurrenderWithSave,
  onMenuReturn,
  dungeonType,
  monstersKilledRef,
  onQuickBattle,
  hasGoldenTicket
}) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { endDungeonSession } = useDungeonSync();
  const { speed, setSpeed, adjustDelay } = useBattleSpeed();
  const {
    accountLevel,
    accountExperience
  } = useGameStore();
  const [selectedPair, setSelectedPair] = React.useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = React.useState<number | string | null>(null);
  const [attackingPair, setAttackingPair] = React.useState<string | null>(null);
  const [attackedTarget, setAttackedTarget] = React.useState<number | null>(null);
  const [defendingPair, setDefendingPair] = React.useState<string | null>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [isAttacking, setIsAttacking] = useState(false);
  
  // Dice roll state
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(true);
  const [diceKey, setDiceKey] = useState(0);
  
  // Roll history (last entry)
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([]);
  
  // Damage indicators for each pair and enemy
  const [pairDamages, setPairDamages] = useState<Map<string, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>>(new Map());
  const [enemyDamages, setEnemyDamages] = useState<Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>>(new Map());
  
  // Attack animation state
  const [attackAnimation, setAttackAnimation] = useState<{
    isActive: boolean;
    type: 'normal' | 'critical' | 'blocked';
    source: 'player' | 'enemy';
    damage?: number;
    attackerId?: string | number;
    targetId?: string | number;
  }>({
    isActive: false,
    type: 'normal',
    source: 'player',
    damage: 0
  });

  // Refs для позиций блоков команды и врагов
  const battleContainerRef = React.useRef<HTMLDivElement>(null);
  const playerTeamRef = React.useRef<HTMLDivElement>(null);
  const enemyTeamRef = React.useRef<HTMLDivElement>(null);

  // Функция для получения центра конкретной карточки по data-атрибуту
  const getCardCenter = (dataAttr: string, id: string | number) => {
    if (!battleContainerRef.current) return { x: 0, y: 0 };
    const el = battleContainerRef.current.querySelector(`[${dataAttr}="${id}"]`) as HTMLElement | null;
    if (!el) return getSectionCenter(dataAttr.includes('pair') ? playerTeamRef : enemyTeamRef);
    const rect = el.getBoundingClientRect();
    const containerRect = battleContainerRef.current.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };

  // Fallback: центр секции
  const getSectionCenter = (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || !battleContainerRef.current) return { x: 0, y: 0 };
    const rect = ref.current.getBoundingClientRect();
    const containerRect = battleContainerRef.current.getBoundingClientRect();
    return {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2
    };
  };
  const alivePairs = playerPairs.filter(pair => pair.health > 0);
  const aliveOpponents = opponents.filter(opp => opp.health > 0);
  const handleAttack = () => {
    if (isAttacking) return; // Block repeated clicks
    if (selectedPair && selectedTarget !== null && typeof selectedTarget === 'number') {
      const pairId = selectedPair;
      const targetId = selectedTarget;
      
      console.log('🎬 [UI] handleAttack: starting player attack flow');
      setIsAttacking(true); // Lock immediately
      
      // Просто вызываем атаку, все таймиги управляются из useTeamBattle
      onAttack(pairId, targetId);
      
      // Сбрасываем UI состояния после полного цикла (3s тайминг из useTeamBattle + margin)
      setTimeout(() => {
        setSelectedPair(null);
        setSelectedTarget(null);
        setAttackingPair(null);
        setAttackedTarget(null);
        setIsAttacking(false); // Unlock after cycle
      }, adjustDelay(4500));
    }
  };
  const handleEnemyAttack = useCallback(() => {
    console.log('🎬 [UI] handleEnemyAttack: starting enemy attack flow, alivePairs:', alivePairs.length);
    
    // Просто вызываем атаку врага, все таймиги управляются из useTeamBattle
    onEnemyAttack();
    
    // Сбрасываем UI состояния после полного цикла
    setTimeout(() => {
      setDefendingPair(null);
    }, adjustDelay(4500));
  }, [alivePairs.length, onEnemyAttack]);
  const getCurrentAttacker = () => {
    const orderedPairs = [...alivePairs].sort((a, b) => a.attackOrder - b.attackOrder);
    return orderedPairs[0];
  };
  const currentAttacker = getCurrentAttacker();

  // Получаем прогресс опыта для отображения
  const xpProgress = getXPProgress(accountExperience);

  // Сбрасываем все состояния анимаций при смене уровня
  useEffect(() => {
    setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
    setIsDiceRolling(false);
    setAttackingPair(null);
    setAttackedTarget(null);
    setDefendingPair(null);
    setSelectedPair(null);
    setSelectedTarget(null);
    setIsAttacking(false);
  }, [level]);

  // Запускаем анимацию атаки когда кубики перестают вращаться
  useEffect(() => {
    // Проверяем что lastRoll существует, кубики не вращаются и уровень совпадает
    if (lastRoll && !isDiceRolling && lastRoll.level === level) {
      // Небольшая задержка перед запуском анимации, чтобы кубики остановились
      const startTimer = setTimeout(() => {
        const animationType = lastRoll.isBlocked 
          ? 'blocked' 
          : lastRoll.isCritical 
            ? 'critical' 
            : 'normal';
        
        setAttackAnimation({
          isActive: true,
          type: animationType,
          source: lastRoll.source,
          damage: lastRoll.damage,
          attackerId: lastRoll.source === 'player' 
            ? ((lastRoll as any).attackerPairId || selectedPair || alivePairs[0]?.id) 
            : (lastRoll as any).attackerOpponentId,
          targetId: lastRoll.source === 'player' 
            ? (lastRoll as any).targetOpponentId 
            : (lastRoll as any).targetPairId
        });

        // Останавливаем анимацию через 2000мс (длительность всей анимации)
        const stopTimer = setTimeout(() => {
          setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
        }, adjustDelay(2000));

        return () => clearTimeout(stopTimer);
      }, adjustDelay(100));

      return () => clearTimeout(startTimer);
    }
  }, [lastRoll, isDiceRolling, level]);

  // Автоматический запуск анимации кубиков + построение истории бросков при получении lastRoll
  const lastProcessedRollRef = useRef<typeof lastRoll>(null);
  
  useEffect(() => {
    if (lastRoll && lastRoll.level === level && lastRoll !== lastProcessedRollRef.current) {
      lastProcessedRollRef.current = lastRoll;
      console.log(`🎲 [UI] Starting dice animation for ${lastRoll.source} (${new Date().toISOString()})`);
      
      // Устанавливаем кто атакует
      setIsPlayerAttacking(lastRoll.source === 'player');
      setIsDiceRolling(true);
      setDiceKey(prev => prev + 1);
      
      // Построение записи истории бросков
      const dicePercent = getDicePercentage(lastRoll.attackerRoll);
      let attackerPower = 0;
      let defenderDefense = 0;
      let attackerName = '';
      let targetName = '';
      
      if (lastRoll.source === 'player') {
        const pair = playerPairs.find(p => p.id === selectedPair) || alivePairs[0];
        const target = opponents.find(o => o.id === (lastRoll as any).targetOpponentId);
        attackerPower = pair?.power || 0;
        defenderDefense = target?.armor || 0;
        attackerName = pair?.hero?.name || 'Игрок';
        targetName = target?.name || 'Монстр';
      } else {
        const targetPairId = (lastRoll as any).targetPairId;
        const targetPair = playerPairs.find(p => p.id === targetPairId) || alivePairs[0];
        // Enemy attacker — find from opponents
        attackerPower = 0; // We don't have the specific enemy stored, use damage calculation
        defenderDefense = targetPair?.defense || 0;
        attackerName = 'Монстр';
        targetName = targetPair?.hero?.name || 'Игрок';
        // Reverse-calculate attacker power from damage for display
        if (!lastRoll.isMiss && lastRoll.damage > 0 && dicePercent > 0) {
          attackerPower = Math.ceil((lastRoll.damage + defenderDefense) / (dicePercent / 100));
        }
      }
      
      const modifiedPower = Math.floor(attackerPower * (dicePercent / 100));
      
      const historyEntry: RollHistoryEntry = {
        id: Date.now(),
        source: lastRoll.source === 'player' ? 'player' : 'opponent',
        diceRoll: lastRoll.attackerRoll,
        dicePercent,
        attackerPower,
        defenderDefense,
        modifiedPower,
        netDamage: lastRoll.damage,
        isMiss: !!lastRoll.isMiss,
        isCritical: !!lastRoll.isCritical,
        isCounterAttack: !!lastRoll.isCounterAttack,
        counterAttackDamage: lastRoll.counterAttackDamage,
        attackerName,
        targetName,
      };
      
      setRollHistory([historyEntry]);
      
      // Если атака врага, показываем урон на конкретной паре после задержки
      if (lastRoll.source === 'enemy' && lastRoll.damage >= 0 && (lastRoll as any).targetPairId) {
        setTimeout(() => {
          const targetPairId = (lastRoll as any).targetPairId;
          setPairDamages(prev => {
            const newMap = new Map(prev);
            newMap.set(targetPairId, {
              damage: lastRoll.damage,
              isCritical: lastRoll.isCritical,
              isBlocked: lastRoll.isBlocked,
              key: Date.now()
            });
            return newMap;
          });
        }, adjustDelay(1500));
      }
      
      // Если атака игрока, показываем урон на конкретном монстре после задержки
      if (lastRoll.source === 'player' && lastRoll.damage >= 0 && (lastRoll as any).targetOpponentId) {
        setTimeout(() => {
          const targetOpponentId = (lastRoll as any).targetOpponentId;
          setEnemyDamages(prev => {
            const newMap = new Map(prev);
            newMap.set(targetOpponentId, {
              damage: lastRoll.damage,
              isCritical: lastRoll.isCritical,
              isBlocked: lastRoll.isBlocked,
              key: Date.now()
            });
            return newMap;
          });
        }, adjustDelay(1500));
      }
      
      // Останавливаем кубики через 1500ms (синхронно с RESULT_DISPLAY_MS из useTeamBattle)
      const stopDiceTimer = setTimeout(() => {
        console.log(`🎲 [UI] Stopping dice animation (${new Date().toISOString()})`);
        setIsDiceRolling(false);
      }, adjustDelay(1500));
      
      return () => clearTimeout(stopDiceTimer);
    }
  }, [lastRoll, level, adjustDelay]);

  // Авто-выбор первой живой пары и первой живой цели при ходе игрока
  useEffect(() => {
    if (isPlayerTurn && !isAttacking && !autoBattle) {
      if (!selectedPair || !alivePairs.find(p => p.id === selectedPair)) {
        const firstAlive = alivePairs[0];
        if (firstAlive) setSelectedPair(firstAlive.id);
      }
      if (selectedTarget === null || !aliveOpponents.find(o => o.id === selectedTarget)) {
        const firstAliveOpp = aliveOpponents[0];
        if (firstAliveOpp) setSelectedTarget(firstAliveOpp.id);
      }
    }
  }, [isPlayerTurn, isAttacking, autoBattle, alivePairs.length, aliveOpponents.length]);

  // Таймер хода врага — гарантирует единичное срабатывание даже при лагах сети
  const enemyAttackTimerRef = React.useRef<number | null>(null);
  
  // Автоматический ход противника
  useEffect(() => {
    if (!isPlayerTurn) {
      if (enemyAttackTimerRef.current == null) {
        console.log('🎯 Enemy turn triggered - scheduling attack');
        enemyAttackTimerRef.current = window.setTimeout(() => {
          console.log('⚔️ Executing enemy attack');
          handleEnemyAttack();
          enemyAttackTimerRef.current = null;
        }, adjustDelay(1500));
      }
    } else {
      // Смена хода на игрока — отменяем запланированную атаку, если была
      if (enemyAttackTimerRef.current != null) {
        clearTimeout(enemyAttackTimerRef.current);
        enemyAttackTimerRef.current = null;
      }
    }
    // Без cleanup: повторные ререндеры не должны сбрасывать таймер на enemy-ходу
  }, [isPlayerTurn, handleEnemyAttack]);
  const handleMenuReturn = () => {
    // ✅ КРИТИЧНО: Сохраняем ПОЛНОЕ состояние боя в Zustand перед выходом
    if (onMenuReturn) {
      onMenuReturn();
    } else {
      // Fallback: только флаг (старое поведение)
      useGameStore.getState().setActiveBattleInProgress(true);
      navigate('/menu');
    }
  };
  const handleSurrender = async () => {
    // КРИТИЧНО: Сначала сохраняем состояние карт (здоровье/броню) перед выходом
    if (onSurrenderWithSave) {
      console.log('🏳️ [handleSurrender] Вызываем onSurrenderWithSave для сохранения здоровья карт');
      await onSurrenderWithSave();
    } else {
      console.warn('⚠️ [handleSurrender] onSurrenderWithSave не передан, состояние карт НЕ будет сохранено!');
      
      // Fallback: старая логика без сохранения состояния
      await endDungeonSession();
      // Очищаем состояние через Zustand (не localStorage)
      navigate('/dungeons');
    }
  };
  const handleAutoBattle = () => {
    if (autoBattle) {
      // Выключаем автобой
      setAutoBattle(false);
      setSelectedPair(null);
      setSelectedTarget(null);
      setIsAttacking(false);
    } else {
      // Включаем автобой
      setAutoBattle(true);
    }
  };

  // Refs для стабильных ссылок в автобое (предотвращают пересоздание эффекта)
  const onAttackRef = useRef(onAttack);
  const alivePairsRef = useRef(alivePairs);
  const aliveOpponentsRef = useRef(aliveOpponents);
  const autoAttackIndexRef = useRef(0);
  
  useEffect(() => { onAttackRef.current = onAttack; }, [onAttack]);
  useEffect(() => { alivePairsRef.current = alivePairs; }, [alivePairs]);
  useEffect(() => { aliveOpponentsRef.current = aliveOpponents; }, [aliveOpponents]);

  // Автобой логика — зависимости только от стабильных примитивов
  useEffect(() => {
    if (autoBattle && isPlayerTurn && !isAttacking && alivePairs.length > 0 && aliveOpponents.length > 0) {
      const timer = setTimeout(() => {
        const currentAlivePairs = alivePairsRef.current;
        const currentAliveOpponents = aliveOpponentsRef.current;
        // Deterministic attacker rotation by attackOrder
        const sortedPairs = [...currentAlivePairs].sort((a, b) => a.attackOrder - b.attackOrder);
        const attackerIndex = autoAttackIndexRef.current % sortedPairs.length;
        const attacker = sortedPairs[attackerIndex];
        autoAttackIndexRef.current = attackerIndex + 1;
        // Focus-fire: always target the first alive opponent
        const target = currentAliveOpponents[0];
        if (attacker && target) {
          setIsAttacking(true);
          setAttackingPair(attacker.id);
          setAttackedTarget(target.id);
          setTimeout(() => {
            onAttackRef.current(attacker.id, target.id);
            setTimeout(() => {
              setAttackingPair(null);
              setAttackedTarget(null);
              setIsAttacking(false);
            }, adjustDelay(3500));
          }, adjustDelay(200));
        }
      }, adjustDelay(1000));

      return () => clearTimeout(timer);
    }
  }, [autoBattle, isPlayerTurn, isAttacking, alivePairs.length, aliveOpponents.length, adjustDelay]);
  return <div ref={battleContainerRef} className="h-screen w-screen overflow-hidden p-2 flex flex-col relative">
      {/* Attack Animation Overlay - на уровне всего экрана */}
      <AttackAnimation 
        isActive={attackAnimation.isActive}
        type={attackAnimation.type}
        source={attackAnimation.source}
        attackerPosition={
          attackAnimation.attackerId 
            ? getCardCenter(
                attackAnimation.source === 'player' ? 'data-pair-id' : 'data-opponent-id', 
                attackAnimation.attackerId
              )
            : getSectionCenter(attackAnimation.source === 'player' ? playerTeamRef : enemyTeamRef)
        }
        defenderPosition={
          attackAnimation.targetId
            ? getCardCenter(
                attackAnimation.source === 'player' ? 'data-opponent-id' : 'data-pair-id',
                attackAnimation.targetId
              )
            : getSectionCenter(attackAnimation.source === 'player' ? enemyTeamRef : playerTeamRef)
        }
        damage={attackAnimation.damage}
      />
      <div className="w-full h-full flex flex-col space-y-2">
        {/* Unified Player Block: Header + Combat + Team */}
        <Card variant="menu" className="flex-shrink-0" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          {/* Row 1: Compact Header (single line) */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex gap-1">
              <Button variant="menu" size="sm" className="text-[10px] sm:text-sm px-1.5 py-0.5 h-auto sm:h-7" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }} onClick={handleMenuReturn}>
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5" />
                {t(language, 'battlePage.menu')}
              </Button>
              <Button 
                variant="menu" 
                size="sm" 
                className="text-[10px] sm:text-sm px-1.5 py-0.5 h-auto sm:h-7" 
                style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                onClick={() => setSpeed(speed === 4 ? 1 : speed === 2 ? 4 : 2)}
              >
                <FastForward className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5" />
                x{speed}
              </Button>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs text-white/70">
                {t(language, 'battlePage.level')} {accountLevel}
              </span>
              <div className="w-20 sm:w-28">
                <Progress value={xpProgress.progress * 100} className="h-1" />
              </div>
              <span className="text-[9px] sm:text-xs text-white font-medium">
                Ур. {level}
              </span>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="text-[10px] sm:text-sm px-1.5 py-0.5 h-auto sm:h-7">
                  {t(language, 'battlePage.surrender')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t(language, 'battlePage.leaveDungeon')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t(language, 'battlePage.leaveDungeonWarning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t(language, 'battlePage.no')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSurrender}>{t(language, 'battlePage.yes')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Row 2: Combat Actions */}
          <div className="border-t border-white/10 px-1 py-0.5 sm:px-2 sm:py-1 relative">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <span className="text-[10px] sm:text-xs font-medium">
                  {isPlayerTurn ? <span className="text-green-400">{t(language, 'battlePage.yourTurn')}</span> : <span className="text-red-400">{t(language, 'battlePage.enemyTurn')}</span>}
                </span>

                <div>
                  <InlineDiceDisplay
                    key={`dice-${diceKey}`}
                    isRolling={isDiceRolling}
                    diceValue={lastRoll ? lastRoll.attackerRoll : null}
                    isAttacker={lastRoll ? lastRoll.source === 'player' : isPlayerTurn}
                    label={lastRoll ? (lastRoll.source === 'player' ? t(language, 'battlePage.player') : t(language, 'battlePage.monster')) : (isPlayerTurn ? t(language, 'battlePage.player') : t(language, 'battlePage.monster'))}
                    damage={lastRoll ? lastRoll.damage : undefined}
                    isBlocked={lastRoll ? lastRoll.isBlocked : undefined}
                    isCritical={lastRoll ? lastRoll.isCritical : undefined}
                  />
                </div>

                <div className="flex gap-1">
                  {isPlayerTurn && !autoBattle ? (
                    <Button 
                      onClick={handleAttack} 
                      disabled={isAttacking || !selectedPair || selectedTarget === null || typeof selectedTarget === 'string'} 
                      size="sm" 
                      variant="menu"
                      className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs flex-shrink-0"
                      style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                    >
                      {t(language, 'battlePage.attackButton')}
                    </Button>
                  ) : null}

                  <Button 
                    variant={autoBattle ? "destructive" : "menu"} 
                    size="sm" 
                    onClick={handleAutoBattle}
                    className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs"
                    style={!autoBattle ? { boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' } : undefined}
                  >
                    {autoBattle ? t(language, 'battlePage.stopAutoBattle') : t(language, 'battlePage.autoBattle')}
                  </Button>

                  {hasGoldenTicket && onQuickBattle && (
                    <Button
                      variant="menu"
                      size="sm"
                      onClick={onQuickBattle}
                      className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs bg-yellow-600/80 hover:bg-yellow-500/80 text-yellow-100"
                      style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                    >
                      ⚡ Быстрый бой
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-1">
                <div className="text-[8px] sm:text-[10px] text-white/40 flex flex-wrap gap-x-1.5">
                  <span className="text-red-400">1:⚔️</span>
                  <span className="text-orange-400">2:✕</span>
                  <span className="text-yellow-400">3:50%</span>
                  <span className="text-green-400">4:100%</span>
                  <span className="text-blue-400">5:150%</span>
                  <span className="text-purple-400">6:200%</span>
                </div>

                {rollHistory.length > 0 && rollHistory[0] && (
                  <div className="border-t border-white/10 pt-0.5 space-y-0.5">
                    {(() => {
                      const e = rollHistory[0];
                      const isPlayer = e.source === 'player';
                      const diceColor = [,'text-red-400','text-orange-400','text-yellow-400','text-green-400','text-blue-400','text-purple-400'][e.diceRoll] || 'text-white';
                      return (
                        <div className="text-[10px] sm:text-xs text-white/80 space-y-0.5">
                          <div className={isPlayer ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                            {isPlayer ? '👤' : '👾'} {e.attackerName}
                          </div>
                          <div className={`font-bold ${diceColor}`}>🎲 {e.diceRoll} ({e.dicePercent}%)</div>
                          {!e.isMiss ? (
                            <div className="font-mono">
                              <span className="text-yellow-300">{e.modifiedPower}</span>
                              <span className="text-white/40">−</span>
                              <span className="text-blue-300">{e.defenderDefense}</span>
                              <span className="text-white/40">=</span>
                              <span className={`font-bold ${e.isCritical ? 'text-purple-400' : 'text-red-400'}`}>{e.netDamage}</span>
                            </div>
                          ) : (
                            <div className="text-white/40 italic">промах</div>
                          )}
                          <div className="text-white/50">→{e.targetName}</div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Player Team */}
          <div ref={playerTeamRef} className="border-t border-white/10 overflow-y-auto overflow-x-hidden p-0.5 sm:p-1">
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 sm:gap-1">
              {playerPairs.map((pair, index) => {
                const pairDamage = pairDamages.get(pair.id);
                
                return (
                  <div key={pair.id} data-pair-id={pair.id} className={`relative p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border-2 transition-all cursor-pointer ${pair.health <= 0 ? 'bg-black/30 border-white/30 opacity-50' : attackingPair === pair.id ? 'bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50' : defendingPair === pair.id ? 'bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' : selectedPair === pair.id ? 'bg-white/20 border-white' : 'bg-black/20 border-white/50 hover:border-white'}`} onClick={() => {
                    if (pair.health > 0 && isPlayerTurn) {
                      setSelectedPair(pair.id);
                    }
                  }}>
                    {pairDamage && (
                      <DamageIndicator
                        key={pairDamage.key}
                        damage={pairDamage.damage}
                        isCritical={pairDamage.isCritical}
                        isBlocked={pairDamage.isBlocked}
                        onComplete={() => {
                          setPairDamages(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(pair.id);
                            return newMap;
                          });
                        }}
                      />
                    )}
                    
                    <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                      <div className="flex gap-0.5 sm:gap-1 justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                          {(() => {
                            const heroImage = resolveCardImageSync(pair.hero) || pair.hero.image;
                            return heroImage ? (
                              <img src={heroImage} alt={pair.hero.name} className="w-full h-full object-contain" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white">
                                <span className="text-lg sm:text-xl md:text-2xl">⚔️</span>
                              </div>
                            );
                          })()}
                        </div>
                        
                        {pair.dragon && (
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                            {(() => {
                              const dragonImage = resolveCardImageSync(pair.dragon) || pair.dragon.image;
                              return dragonImage ? (
                                <img src={dragonImage} alt={pair.dragon.name} className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white">
                                  <span className="text-base sm:text-lg md:text-xl">🐲</span>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center w-full">
                        <div className="flex items-center gap-0.5 sm:gap-1 justify-center">
                          <span className="font-semibold text-[8px] sm:text-[10px] bg-white/20 text-white px-0.5 sm:px-1 rounded">
                            #{pair.attackOrder}
                          </span>
                        </div>
                        <span className="font-medium text-[9px] sm:text-[10px] md:text-xs text-white block truncate px-0.5">{getTranslatedCardName(pair.hero.name, language)}</span>
                        {pair.dragon && <div className="text-[8px] sm:text-[9px] md:text-[10px] text-white/70 truncate px-0.5">
                            + {getTranslatedCardName(pair.dragon.name, language)}
                          </div>}
                      </div>
                      
                      <div className="w-full space-y-0.5">
                        <div className="w-full">
                          <Progress 
                            value={(pair.hero.currentHealth ?? pair.hero.health) / pair.hero.health * 100} 
                            className="h-1 sm:h-1.5" 
                          />
                          <div className="text-[8px] sm:text-[9px] md:text-[10px] text-center mt-0.5 text-white">
                            <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 inline mr-0.5" />
                            {pair.hero.currentHealth ?? pair.hero.health}/{pair.hero.health}
                          </div>
                        </div>
                        
                        {pair.dragon && (
                          <div className="w-full">
                            <Progress 
                              value={(pair.dragon.currentHealth ?? pair.dragon.health) / pair.dragon.health * 100} 
                              className="h-1 sm:h-1.5" 
                            />
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] text-center mt-0.5 text-white/80">
                              <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 inline mr-0.5" />
                              {pair.dragon.currentHealth ?? pair.dragon.health}/{pair.dragon.health}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] md:text-[10px] text-white justify-center">
                        <span className="flex items-center">
                          <Sword className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                          {pair.power}
                        </span>
                        <span className="flex items-center">
                          <Shield className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />
                          {pair.currentDefense ?? pair.defense}/{pair.maxDefense ?? pair.defense}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
          {/* Enemy Team - Lower Part */}
          <Card ref={enemyTeamRef} variant="menu" className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <CardHeader className="py-2 flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-red-400 justify-center text-sm">
                <Sword className="w-4 h-4" />
                {t(language, 'battlePage.enemies')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-0.5 sm:p-1">
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-0.5 sm:gap-1">
                {opponents.map((opponent, index) => {
                  const enemyDamage = enemyDamages.get(opponent.id);
                  
                  return <div key={opponent.id} data-opponent-id={opponent.id} className={`relative rounded-lg sm:rounded-2xl border-2 transition-all overflow-hidden h-32 sm:h-40 md:h-48 ${opponent.health <= 0 ? 'border-white/30' : attackedTarget === opponent.id ? 'border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50 cursor-pointer' : selectedTarget === opponent.id ? 'border-red-400 bg-red-400/10 cursor-pointer' : 'border-white/50 hover:border-red-400/50 cursor-pointer'}`} onClick={() => {
                if (opponent.health > 0 && isPlayerTurn) {
                  setSelectedTarget(opponent.id);
                }
              }}>
                    {/* Damage Indicator */}
                    {enemyDamage && (
                      <DamageIndicator
                        key={enemyDamage.key}
                        damage={enemyDamage.damage}
                        isCritical={enemyDamage.isCritical}
                        isBlocked={enemyDamage.isBlocked}
                        onComplete={() => {
                          setEnemyDamages(prev => {
                            const newMap = new Map(prev);
                            newMap.delete(opponent.id);
                            return newMap;
                          });
                        }}
                      />
                    )}
                    
                    {/* Vertical Health Bar - Left Side */}
                    <div className="absolute left-0.5 sm:left-1 top-1 sm:top-2 bottom-1 sm:bottom-2 w-2 sm:w-3 bg-black/60 rounded-full flex flex-col justify-end z-20">
                      <div 
                        className="bg-red-500 rounded-full transition-all duration-300"
                        style={{ 
                          height: `${(opponent.health / opponent.maxHealth) * 100}%`,
                          minHeight: '2px'
                        }}
                      />
                    </div>

                    {/* Background Image */}
                    {opponent.image && <div className={`absolute inset-0 bg-cover bg-center bg-no-repeat image-rendering-crisp-edges transition-all ${opponent.health <= 0 ? 'grayscale' : ''}`} style={{
                  backgroundImage: `url(${opponent.image})`,
                  imageRendering: 'crisp-edges'
                }} />}
                    
                    {/* Killed overlay */}
                    {opponent.health <= 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                        <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
                          {t(language, 'battlePage.killed')}
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay for stats */}
                    <div className="relative z-10 p-1 sm:p-1.5 md:p-2 bg-black/20 h-full flex flex-col justify-between">
                      {/* Health and Stats Overlay */}
                      <div className="text-right ml-3 sm:ml-4">
                        <div className="text-red-500 font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg">
                          ❤️ {opponent.health}/{opponent.maxHealth}
                        </div>
                        <div className="text-red-500 font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg">
                          ⚔️ {opponent.power}
                        </div>
                        <div className="text-red-500 font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg">
                          🛡️ {opponent.armor ?? 0}
                        </div>
                      </div>
                      
                      {/* Name */}
                      <div className="text-center">
                        <div className="text-red-500 font-bold text-[9px] sm:text-[10px] md:text-xs drop-shadow-lg truncate px-1">
                          {opponent.name}
                        </div>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};