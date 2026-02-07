import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sword, Shield, Heart, ArrowLeft, Flag, Clock, Bot, RefreshCw, Dices, Zap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { InlineDiceDisplay } from "../battle/InlineDiceDisplay";
import { DamageIndicator } from "../battle/DamageIndicator";
import { AttackAnimation } from "../battle/AttackAnimation";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getCardImageByRarity, normalizeCardImageUrl } from "@/utils/cardImageResolver";
import { useBattleSpeed } from "@/contexts/BattleSpeedContext";
import { PvPRollHistory, RollHistoryEntry } from "./PvPRollHistory";

import { PvPPair } from "@/hooks/usePvP";

type PvPUnit = {
  name: string;
  faction?: string;
  image?: string;
  rarity?: number;
};

const toLocalLovableUploads = (url: string): string | null => {
  const marker = "/storage/v1/object/public/lovable-uploads/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  const tail = url.slice(idx + marker.length).replace(/^\/+/, "");
  if (!tail) return null;
  return `/lovable-uploads/${tail}`;
};

const PvPUnitImage: React.FC<{
  unit: PvPUnit;
  unitType: "hero" | "dragon";
  alt: string;
  width: number;
  height: number;
  className?: string;
}> = ({ unit, unitType, alt, width, height, className }) => {
  const placeholder = "/placeholder.svg";

  const [src, setSrc] = useState<string>(() => normalizeCardImageUrl(unit.image) || "");

  useEffect(() => {
    let cancelled = false;

    const resolve = async () => {
      const direct = normalizeCardImageUrl(unit.image);
      if (direct) {
        if (!cancelled) setSrc(direct);
        return;
      }

      try {
        const resolved = await getCardImageByRarity({
          name: unit.name,
          faction: unit.faction,
          type: unitType,
          rarity: unit.rarity || 1,
          image: undefined,
        } as any);
        if (!cancelled) setSrc(resolved || "");
      } catch {
        if (!cancelled) setSrc("");
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [unit.image, unit.name, unit.faction, unitType]);

  const candidates = useMemo(() => {
    const first = src || "";
    const localFallback = first ? toLocalLovableUploads(first) : null;
    return {
      first,
      localFallback,
    };
  }, [src]);

  const handleError = () => {
    setSrc((prev) => {
      const local = prev ? toLocalLovableUploads(prev) : null;
      if (local && local !== prev) return local;
      return placeholder;
    });
  };

  const finalSrc = candidates.first || placeholder;

  return (
    <OptimizedImage
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      placeholder={placeholder}
      priority={false}
      progressive={false}
      className={className}
      onError={handleError}
    />
  );
};

// D6 roll result description — uses unified dice formula
import { getDiceDescription as getUnifiedDiceDescription, getDicePercentage } from '@/utils/diceFormula';

const getDiceResultDescription = (roll: number): { text: string; color: string } => {
  return getUnifiedDiceDescription(roll);
};

interface PvPBattleArenaProps {
  myPairs: PvPPair[];
  opponentPairs: PvPPair[];
  isMyTurn: boolean;
  turnNumber: number;
  timeRemaining: number | null;
  turnTimeoutSeconds: number;
  timeoutWarnings: { my: number; opponent: number };
  opponentWallet: string;
  isBotMatch?: boolean;
  isLoading: boolean;
  isPolling: boolean;
  amIPlayer1?: boolean;
  lastRoll?: {
    attackerRoll: number;
    defenderRoll?: number;
    source: "player" | "opponent";
    damage: number;
    isBlocked?: boolean;
    isCritical?: boolean;
    isMiss?: boolean;
    isCounterAttack?: boolean;
    counterAttackDamage?: number;
    description?: string;
  } | null;
  initiative?: {
    player1_roll: number;
    player2_roll: number;
    first_turn: "player1" | "player2";
  } | null;
  onAttack: (attackerIndex: number, targetIndex: number) => Promise<void>;
  onSurrender: () => Promise<void>;
  onTimeout: () => Promise<void>;
}

export const PvPBattleArena: React.FC<PvPBattleArenaProps> = ({
  myPairs,
  opponentPairs,
  isMyTurn,
  turnNumber,
  timeRemaining,
  turnTimeoutSeconds,
  timeoutWarnings,
  opponentWallet,
  isBotMatch,
  isLoading,
  isPolling,
  amIPlayer1 = true,
  lastRoll,
  initiative,
  onAttack,
  onSurrender,
  onTimeout,
}) => {
  const navigate = useNavigate();
  const { adjustDelay } = useBattleSpeed();
  const [selectedPair, setSelectedPair] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [autoSelect, setAutoSelect] = useState(false);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceKey, setDiceKey] = useState(0);
  const [showInitiative, setShowInitiative] = useState(turnNumber === 1 && !!initiative);
  const [lastAttackerIndex, setLastAttackerIndex] = useState<number | null>(null);
  const [lastTargetIndex, setLastTargetIndex] = useState<number | null>(null);
  
  // Highlighting states for attacking/defending pairs
  const [attackingPairIndex, setAttackingPairIndex] = useState<number | null>(null);
  const [defendingPairIndex, setDefendingPairIndex] = useState<number | null>(null);
  const [attackingTeam, setAttackingTeam] = useState<"my" | "opponent" | null>(null);
  
  // Attack animation state
  const [attackAnimation, setAttackAnimation] = useState<{
    isActive: boolean;
    type: 'normal' | 'critical' | 'blocked';
    source: 'player' | 'enemy';
    damage: number;
  }>({ isActive: false, type: 'normal', source: 'player', damage: 0 });
  
  // Refs for card positions (for attack animation trajectory)
  const myPairRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const opponentPairRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const battleContainerRef = useRef<HTMLDivElement>(null);
  
  // Animation positions
  const [attackerPos, setAttackerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [defenderPos, setDefenderPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Roll history (last 2 entries)
  const [rollHistory, setRollHistory] = useState<RollHistoryEntry[]>([]);
  const [myDamages, setMyDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());
  const [opponentDamages, setOpponentDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());

  // Local countdown timer
  const [localTimer, setLocalTimer] = useState<number | null>(timeRemaining);
  const timeoutTriggeredRef = useRef(false);

  // Reset local timer when server time_remaining changes (new turn)
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      setLocalTimer(timeRemaining);
      timeoutTriggeredRef.current = false;
    }
  }, [timeRemaining, isMyTurn]);

  // Countdown every second
  useEffect(() => {
    if (localTimer === null || localTimer <= 0) return;
    
    const interval = setInterval(() => {
      setLocalTimer(prev => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) return 0;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localTimer !== null && localTimer > 0]);

  // Auto-trigger timeout when timer hits 0
  useEffect(() => {
    if (localTimer === 0 && !timeoutTriggeredRef.current) {
      timeoutTriggeredRef.current = true;
      console.log('[PvP Timer] Time expired, triggering timeout');
      onTimeout();
    }
  }, [localTimer, onTimeout]);

  // Hide initiative after 3 seconds
  useEffect(() => {
    if (showInitiative) {
      const timer = setTimeout(() => setShowInitiative(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showInitiative]);

  // Auto-select first alive pairs when it's my turn and autoSelect is enabled
  useEffect(() => {
    if (!autoSelect || !isMyTurn) return;
    
    const firstAliveAttacker = myPairs.findIndex(p => p.currentHealth > 0);
    const firstAliveTarget = opponentPairs.findIndex(p => p.currentHealth > 0);
    
    if (firstAliveAttacker >= 0) setSelectedPair(firstAliveAttacker);
    if (firstAliveTarget >= 0) setSelectedTarget(firstAliveTarget);
  }, [autoSelect, isMyTurn, myPairs, opponentPairs]);

  // Helper function to get card position relative to battle container
  const getCardPosition = useCallback((isMyTeam: boolean, pairIndex: number): { x: number; y: number } => {
    const refs = isMyTeam ? myPairRefs : opponentPairRefs;
    const cardEl = refs.current.get(pairIndex);
    const containerEl = battleContainerRef.current;
    
    if (!cardEl || !containerEl) {
      return { x: 100, y: isMyTeam ? 100 : 400 };
    }
    
    const cardRect = cardEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();
    
    return {
      x: cardRect.left - containerRect.left + cardRect.width / 2,
      y: cardRect.top - containerRect.top + cardRect.height / 2
    };
  }, []);

  // Helper: get dice percent from roll — uses unified formula
  const getDicePercent = (roll: number): number => {
    return getDicePercentage(roll);
  };

  // Track processed rolls to prevent duplicates from dependency changes
  const lastProcessedRollRef = useRef<typeof lastRoll>(null);
  const stopTimerRef = useRef<number | null>(null);

  // Snapshot mutable pair data into refs so the effect doesn't re-fire on array identity changes
  const myPairsRef = useRef(myPairs);
  myPairsRef.current = myPairs;
  const opponentPairsRef = useRef(opponentPairs);
  opponentPairsRef.current = opponentPairs;

  // Handle dice roll animation when lastRoll changes
  useEffect(() => {
    if (lastRoll && lastRoll !== lastProcessedRollRef.current) {
      lastProcessedRollRef.current = lastRoll;

      // Clear any previous animation timer
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }

      setDiceKey((prev) => prev + 1);
      setIsDiceRolling(true);
      
      // Read pairs from refs to avoid dependency on array identity
      const currentMyPairs = myPairsRef.current;
      const currentOpponentPairs = opponentPairsRef.current;
      
      // Set highlighting for attacking/defending pairs
      let attackerIdx: number;
      let targetIdx: number;
      let isPlayerAttacking: boolean;
      
      if (lastRoll.source === "player") {
        attackerIdx = lastAttackerIndex ?? 0;
        targetIdx = lastTargetIndex ?? 0;
        setAttackingPairIndex(attackerIdx);
        setDefendingPairIndex(targetIdx);
        setAttackingTeam("my");
        isPlayerAttacking = true;
      } else {
        // Opponent attacking - find first alive pair as target
        targetIdx = currentMyPairs.findIndex(p => p.currentHealth > 0);
        attackerIdx = currentOpponentPairs.findIndex(p => p.currentHealth > 0);
        setAttackingPairIndex(attackerIdx >= 0 ? attackerIdx : 0);
        setDefendingPairIndex(targetIdx >= 0 ? targetIdx : 0);
        setAttackingTeam("opponent");
        isPlayerAttacking = false;
      }

      // Build roll history entry
      const dicePercent = getDicePercent(lastRoll.attackerRoll);
      let aPower = 0;
      let dDefense = 0;
      let attackerName = "";
      let targetName = "";

      if (isPlayerAttacking) {
        const aPair = currentMyPairs[attackerIdx];
        const tPair = currentOpponentPairs[targetIdx];
        aPower = aPair?.totalPower ?? 0;
        dDefense = tPair?.currentDefense ?? 0;
        attackerName = aPair?.hero?.name ?? "Вы";
        targetName = tPair?.hero?.name ?? "Противник";
      } else {
        const aIdx = attackerIdx >= 0 ? attackerIdx : 0;
        const tIdx = targetIdx >= 0 ? targetIdx : 0;
        const aPair = currentOpponentPairs[aIdx];
        const tPair = currentMyPairs[tIdx];
        aPower = aPair?.totalPower ?? 0;
        dDefense = tPair?.currentDefense ?? 0;
        attackerName = aPair?.hero?.name ?? "Противник";
        targetName = tPair?.hero?.name ?? "Вы";
      }

      const modifiedPower = Math.floor(aPower * (dicePercent / 100));
      const netDamage = lastRoll.isMiss ? 0 : Math.max(1, modifiedPower - dDefense);

      const historyEntry: RollHistoryEntry = {
        id: Date.now(),
        source: lastRoll.source,
        diceRoll: lastRoll.attackerRoll,
        dicePercent,
        attackerPower: aPower,
        defenderDefense: dDefense,
        modifiedPower,
        netDamage: lastRoll.damage || netDamage,
        isMiss: !!lastRoll.isMiss,
        isCritical: !!lastRoll.isCritical,
        isCounterAttack: !!lastRoll.isCounterAttack,
        counterAttackDamage: lastRoll.counterAttackDamage,
        attackerName,
        targetName,
      };

      setRollHistory(prev => [historyEntry, ...prev].slice(0, 2));
      
      // Calculate positions for animation after a short delay to allow refs to update
      requestAnimationFrame(() => {
        if (isPlayerAttacking) {
          setAttackerPos(getCardPosition(true, attackerIdx));
          setDefenderPos(getCardPosition(false, targetIdx));
        } else {
          setAttackerPos(getCardPosition(false, attackerIdx >= 0 ? attackerIdx : 0));
          setDefenderPos(getCardPosition(true, targetIdx >= 0 ? targetIdx : 0));
        }
      });
      
      // Determine animation type based on roll result
      const animationType: 'normal' | 'critical' | 'blocked' = 
        lastRoll.isMiss ? 'blocked' : lastRoll.isCritical ? 'critical' : 'normal';
      
      // Start attack animation
      setAttackAnimation({
        isActive: true,
        type: animationType,
        source: lastRoll.source === "player" ? 'player' : 'enemy',
        damage: lastRoll.damage
      });

      // Capture lastRoll values for the timeout closure
      const rollSource = lastRoll.source;
      const rollDamage = lastRoll.damage;
      const rollIsCritical = lastRoll.isCritical;
      const rollIsMiss = lastRoll.isMiss;
      const rollIsCounterAttack = lastRoll.isCounterAttack;
      const rollCounterAttackDamage = lastRoll.counterAttackDamage;
      const savedLastAttackerIndex = lastAttackerIndex;
      const savedLastTargetIndex = lastTargetIndex;

      stopTimerRef.current = window.setTimeout(() => {
        stopTimerRef.current = null;
        setIsDiceRolling(false);
        
        // Stop attack animation
        setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
        
        // Clear highlighting
        setAttackingPairIndex(null);
        setDefendingPairIndex(null);
        setAttackingTeam(null);

        // Show damage indicator on correct card
        if (rollSource === "player") {
          const tIdx = savedLastTargetIndex ?? 0;
          if (rollDamage > 0 || rollIsMiss) {
            setOpponentDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(tIdx, {
                damage: rollDamage,
                isCritical: rollIsCritical,
                isBlocked: rollIsMiss,
                key: Date.now(),
              });
              return newMap;
            });
          }
          if (rollIsCounterAttack && rollCounterAttackDamage && rollCounterAttackDamage > 0) {
            const aIdx = savedLastAttackerIndex ?? 0;
            setMyDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(aIdx, {
                damage: rollCounterAttackDamage!,
                isCritical: false,
                isBlocked: false,
                key: Date.now() + 1,
              });
              return newMap;
            });
          }
        } else {
          const tIdx = myPairsRef.current.findIndex(p => p.currentHealth > 0);
          if (rollDamage > 0 || rollIsMiss) {
            setMyDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(tIdx >= 0 ? tIdx : 0, {
                damage: rollDamage,
                isCritical: rollIsCritical,
                isBlocked: rollIsMiss,
                key: Date.now(),
              });
              return newMap;
            });
          }
        }
      }, adjustDelay(2000));
    }
  }, [lastRoll, adjustDelay, lastAttackerIndex, lastTargetIndex]);

  const handleAttack = useCallback(async () => {
    if (selectedPair === null || selectedTarget === null) return;

    // Save indices for damage display
    setLastAttackerIndex(selectedPair);
    setLastTargetIndex(selectedTarget);

    await onAttack(selectedPair, selectedTarget);
    setSelectedPair(null);
    setSelectedTarget(null);
  }, [selectedPair, selectedTarget, onAttack]);

  // Render a pair card
  const renderPairCard = (
    pair: PvPPair,
    index: number,
    isMyTeam: boolean,
    damageIndicator?: { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number },
  ) => {
    const isSelected = isMyTeam ? selectedPair === index : selectedTarget === index;
    const isDead = pair.currentHealth <= 0;
    const healthPercent = pair.totalHealth > 0 ? (pair.currentHealth / pair.totalHealth) * 100 : 0;
    
    // Highlight attacking pair (red) or defending pair (blue)
    const isAttacking = isMyTeam 
      ? (attackingTeam === "my" && attackingPairIndex === index)
      : (attackingTeam === "opponent" && attackingPairIndex === index);
    const isDefending = isMyTeam 
      ? (attackingTeam === "opponent" && defendingPairIndex === index)
      : (attackingTeam === "my" && defendingPairIndex === index);

    return (
      <div
        key={index}
        ref={(el) => {
          if (el) {
            if (isMyTeam) {
              myPairRefs.current.set(index, el);
            } else {
              opponentPairRefs.current.set(index, el);
            }
          }
        }}
        className={`relative p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border-2 transition-all cursor-pointer ${
          isDead
            ? "bg-black/30 border-white/30 opacity-50"
            : isAttacking
              ? "bg-red-500/30 border-red-500 animate-pulse scale-105 shadow-lg shadow-red-500/50"
              : isDefending
                ? "bg-blue-500/30 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50"
                : isSelected
                  ? isMyTeam
                    ? "bg-white/20 border-white"
                    : "bg-red-400/20 border-red-400"
                  : "bg-black/20 border-white/50 hover:border-white"
        }`}
        onClick={() => {
          if (isDead || !isMyTurn) return;
          if (isMyTeam) {
            setSelectedPair(index);
          } else if (selectedPair !== null) {
            setSelectedTarget(index);
          }
        }}
      >
        {/* Damage Indicator */}
        {damageIndicator && (
          <DamageIndicator
            key={damageIndicator.key}
            damage={damageIndicator.damage}
            isCritical={damageIndicator.isCritical}
            isBlocked={damageIndicator.isBlocked}
            onComplete={() => {
              if (isMyTeam) {
                setMyDamages((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(index);
                  return newMap;
                });
              } else {
                setOpponentDamages((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(index);
                  return newMap;
                });
              }
            }}
          />
        )}

        <div className="flex flex-col items-center gap-0.5 sm:gap-1">
          {/* Card Images */}
          <div className="flex gap-0.5 sm:gap-1 justify-center">
            {/* Hero Image */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
              <PvPUnitImage
                unit={{
                  ...pair.hero,
                  rarity: pair.hero.rarity,
                }}
                unitType="hero"
                alt={pair.hero.name}
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Dragon Image */}
            {pair.dragon && (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                <PvPUnitImage
                  unit={{
                    ...pair.dragon,
                    rarity: pair.dragon.rarity,
                  }}
                  unitType="dragon"
                  alt={pair.dragon.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Pair Index & Name */}
          <div className="text-center">
            <span className="text-[8px] sm:text-[10px] md:text-xs bg-white/20 px-1 rounded text-white">
              #{index + 1}
            </span>
            <div className="text-[10px] sm:text-xs md:text-sm font-medium text-white truncate max-w-full">
              {pair.hero?.name || "Герой"}
            </div>
            {pair.dragon && (
              <div className="text-[8px] sm:text-[10px] text-white/70 truncate">+ {pair.dragon.name}</div>
            )}
          </div>

          {/* Health Bars */}
          <div className="w-full space-y-0.5">
            {/* Hero Health */}
            <div className="w-full">
              <Progress value={(pair.hero.currentHealth / pair.hero.health) * 100} className="h-1 sm:h-1.5" />
              <div className="text-[8px] sm:text-[9px] md:text-[10px] text-center mt-0.5 text-white">
                <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 inline mr-0.5 text-red-400" />
                {pair.hero.currentHealth}/{pair.hero.health}
              </div>
            </div>

            {/* Dragon Health */}
            {pair.dragon && (
              <div className="w-full">
                <Progress value={(pair.dragon.currentHealth / pair.dragon.health) * 100} className="h-1 sm:h-1.5" />
                <div className="text-[8px] sm:text-[9px] md:text-[10px] text-center mt-0.5 text-white">
                  <Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 inline mr-0.5 text-purple-400" />
                  {pair.dragon.currentHealth}/{pair.dragon.health}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-between w-full text-[8px] sm:text-[10px] text-white/80 px-1">
            <span className="flex items-center gap-0.5">
              <Sword className="w-2 h-2 sm:w-3 sm:h-3 text-yellow-400" />
              {pair.totalPower}
            </span>
            <span className="flex items-center gap-0.5">
              <Shield className="w-2 h-2 sm:w-3 sm:h-3 text-blue-400" />
              {pair.currentDefense}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Initiative overlay
  const renderInitiativeOverlay = () => {
    if (!showInitiative || !initiative) return null;
    
    const iWonInitiative = amIPlayer1
      ? initiative.first_turn === "player1"
      : initiative.first_turn === "player2";
    
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <Card variant="menu" className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-white flex items-center justify-center gap-2">
              <Dices className="w-6 h-6" />
              Бросок на инициативу
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <div className="text-white/70 text-sm mb-2">Вы</div>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {amIPlayer1 ? initiative.player1_roll : initiative.player2_roll}
                </div>
              </div>
              <div className="text-2xl text-white/50">VS</div>
              <div className="text-center">
                <div className="text-white/70 text-sm mb-2">Противник</div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {amIPlayer1 ? initiative.player2_roll : initiative.player1_roll}
                </div>
              </div>
            </div>
            <div className={`text-center text-lg font-bold ${iWonInitiative ? "text-green-400" : "text-red-400"}`}>
              {iWonInitiative ? "Вы атакуете первым!" : "Противник атакует первым!"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Get roll result info for display
  const rollResultInfo = lastRoll ? getDiceResultDescription(lastRoll.attackerRoll) : null;

  return (
    <div ref={battleContainerRef} className="w-full h-full flex flex-col space-y-1 sm:space-y-2 p-1 sm:p-2 relative overflow-y-auto">
      {/* Attack Animation Overlay - positioned over entire battle area */}
      <AttackAnimation 
        isActive={attackAnimation.isActive}
        type={attackAnimation.type}
        source={attackAnimation.source}
        attackerPosition={attackerPos}
        defenderPosition={defenderPos}
        damage={attackAnimation.damage}
      />
      
      {/* Initiative Overlay */}
      {renderInitiativeOverlay()}

      {/* Header */}
      <Card variant="menu" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
        <CardHeader className="py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0 sm:relative">
            {/* Left buttons */}
            <div className="flex gap-1 sm:gap-2 sm:absolute sm:left-0 sm:top-0">
              <Button
                variant="menu"
                size="sm"
                className="text-[10px] sm:text-sm px-2 py-1 h-auto sm:h-9"
                onClick={() => navigate("/pvp")}
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                Назад
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="text-[10px] sm:text-sm px-2 py-1 h-auto sm:h-9">
                    <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
                    Сдаться
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Сдаться?</AlertDialogTitle>
                    <AlertDialogDescription>Вы проиграете этот матч и потеряете ELO рейтинг.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={onSurrender}>Сдаться</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Center title */}
            <CardTitle className="text-center text-sm sm:text-lg text-white flex-1">
              PvP Арена - Ход {turnNumber}
              {isBotMatch && (
                <span className="ml-2 text-xs text-muted-foreground">
                  <Bot className="w-3 h-3 inline" /> Бот
                </span>
              )}
            </CardTitle>

            {/* Right - turn indicator, timer, and warnings */}
            <div className="flex items-center gap-2 sm:absolute sm:right-0 sm:top-0">
              {isPolling && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
              
              {/* Countdown Timer */}
              {localTimer !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-xs sm:text-sm font-bold ${
                  localTimer <= 10 
                    ? "bg-red-600/90 text-white animate-pulse" 
                    : localTimer <= 20 
                      ? "bg-orange-500/80 text-white" 
                      : "bg-white/10 text-white/80"
                }`}>
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {Math.floor(localTimer / 60)}:{(localTimer % 60).toString().padStart(2, "0")}
                </div>
              )}
              
              {/* Turn Indicator */}
              <div
                className={`px-2 py-1 rounded text-xs sm:text-sm font-medium ${
                  isMyTurn ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"
                }`}
              >
                {isMyTurn ? "Ваш ход" : "Ход противника"}
              </div>
              
              {/* Timeout Warnings */}
              {(timeoutWarnings.my > 0 || timeoutWarnings.opponent > 0) && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs">
                  {timeoutWarnings.my > 0 && (
                    <span className="bg-red-500/80 text-white px-1.5 py-0.5 rounded" title="Ваши предупреждения">
                      ⚠️ {timeoutWarnings.my}/2
                    </span>
                  )}
                  {timeoutWarnings.opponent > 0 && (
                    <span className="bg-yellow-500/80 text-black px-1.5 py-0.5 rounded" title="Предупреждения противника">
                      👤 {timeoutWarnings.opponent}/2
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex-1 flex flex-col space-y-1 sm:space-y-2 overflow-hidden min-h-0">
        {/* My Team - Upper Part */}
        <Card variant="menu" className="flex-1 min-h-0" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
          <CardContent className="h-full overflow-y-auto overflow-x-hidden p-0.5 sm:p-1 pt-1 sm:pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5 sm:gap-1">
              {myPairs.map((pair, index) => renderPairCard(pair, index, true, myDamages.get(index)))}
            </div>
          </CardContent>
        </Card>

        {/* Action Panel with Roll History */}
        <Card variant="menu" className="flex-shrink-0" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
          <CardContent className="py-2 sm:py-3">
            <div className="flex gap-3">
              {/* Left: Dice + Controls */}
              <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                {/* Single Dice Display (only attacker rolls now) */}
                <div className="flex items-center justify-center gap-4 w-full">
                  <InlineDiceDisplay
                    key={`dice-${diceKey}`}
                    isRolling={isDiceRolling}
                    diceValue={lastRoll?.attackerRoll ?? null}
                    isAttacker={true}
                    label={isMyTurn ? "Ваш бросок" : (lastRoll?.source === "opponent" ? "Бросок противника" : "Ожидание...")}
                  />

                  {/* Attack Button + Auto-select toggle */}
                  {isMyTurn ? (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleAttack}
                        disabled={selectedPair === null || selectedTarget === null || isLoading}
                        size="sm"
                        variant="menu"
                        className="h-8 sm:h-10 px-4 sm:px-6 text-sm sm:text-base"
                        style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}
                      >
                        <Sword className="w-4 h-4 mr-2" />
                        Атаковать
                      </Button>
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id="auto-select"
                          checked={autoSelect}
                          onCheckedChange={setAutoSelect}
                          className="scale-75 sm:scale-100"
                        />
                        <Label htmlFor="auto-select" className="text-[10px] sm:text-xs text-white/80 cursor-pointer flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          Авто
                        </Label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-8 sm:h-10 flex items-center text-white/70 text-sm">Ожидание хода...</div>
                      <div className="flex items-center gap-1.5">
                        <Switch
                          id="auto-select-wait"
                          checked={autoSelect}
                          onCheckedChange={setAutoSelect}
                          className="scale-75 sm:scale-100"
                        />
                        <Label htmlFor="auto-select-wait" className="text-[10px] sm:text-xs text-white/80 cursor-pointer flex items-center gap-0.5">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          Авто
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Roll Result Description */}
                {lastRoll && rollResultInfo && (
                  <div className={`text-sm font-medium ${rollResultInfo.color}`}>
                    {rollResultInfo.text}
                    {lastRoll.damage > 0 && ` → ${lastRoll.damage} урона`}
                    {lastRoll.isCounterAttack && lastRoll.counterAttackDamage && lastRoll.counterAttackDamage > 0 && (
                      <span className="text-red-400 ml-2">
                        (Контратака: {lastRoll.counterAttackDamage} урона вам!)
                      </span>
                    )}
                  </div>
                )}

                {/* Selection hints */}
                {isMyTurn && selectedPair === null && (
                  <div className="text-[10px] sm:text-xs text-white/70">Выберите пару для атаки</div>
                )}
                {isMyTurn && selectedPair !== null && selectedTarget === null && (
                  <div className="text-[10px] sm:text-xs text-white/70">Выберите цель для атаки</div>
                )}

                {/* D6 Legend */}
                <div className="text-[8px] sm:text-[10px] text-white/50 flex flex-wrap justify-center gap-x-2 gap-y-0.5">
                  <span className="text-red-400">1:Контратака</span>
                  <span className="text-orange-400">2:Промах</span>
                  <span className="text-yellow-400">3:50%</span>
                  <span className="text-green-400">4:100%</span>
                  <span className="text-blue-400">5:150%</span>
                  <span className="text-purple-400">6:200%</span>
                </div>
              </div>

              {/* Right: Roll History */}
              {rollHistory.length > 0 && (
                <div className="flex-1 min-w-0 border-l border-white/10 pl-3">
                  <PvPRollHistory history={rollHistory} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opponent Team - Lower Part */}
        <Card
          variant="menu"
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}
        >
          <CardHeader className="py-2 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-red-400 justify-center text-sm">
              <Sword className="w-4 h-4" />
              Противник: {opponentWallet.slice(0, 12)}...
              {isBotMatch && <Bot className="w-4 h-4 ml-1" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-0.5 sm:p-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5 sm:gap-1">
              {opponentPairs.map((pair, index) => renderPairCard(pair, index, false, opponentDamages.get(index)))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
