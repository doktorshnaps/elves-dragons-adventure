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
import { Sword, Shield, Heart, ArrowLeft, Flag, Clock, Bot, RefreshCw, Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InlineDiceDisplay } from "../battle/InlineDiceDisplay";
import { DamageIndicator } from "../battle/DamageIndicator";
import { AttackAnimation } from "../battle/AttackAnimation";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getCardImageByRarity, normalizeCardImageUrl } from "@/utils/cardImageResolver";
import { useBattleSpeed } from "@/contexts/BattleSpeedContext";

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

// D6 roll result description
const getDiceResultDescription = (roll: number): { text: string; color: string } => {
  switch (roll) {
    case 1:
      return { text: "Критический промах! Контратака!", color: "text-red-500" };
    case 2:
      return { text: "Промах!", color: "text-orange-400" };
    case 3:
      return { text: "Слабый удар (50%)", color: "text-yellow-400" };
    case 4:
      return { text: "Нормальный удар (100%)", color: "text-green-400" };
    case 5:
      return { text: "Сильный удар (150%)", color: "text-blue-400" };
    case 6:
      return { text: "Критический удар! (200%)", color: "text-purple-400" };
    default:
      return { text: "", color: "text-white" };
  }
};

interface PvPBattleArenaProps {
  myPairs: PvPPair[];
  opponentPairs: PvPPair[];
  isMyTurn: boolean;
  turnNumber: number;
  timeRemaining: number | null;
  opponentWallet: string;
  isBotMatch?: boolean;
  isLoading: boolean;
  isPolling: boolean;
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
}

export const PvPBattleArena: React.FC<PvPBattleArenaProps> = ({
  myPairs,
  opponentPairs,
  isMyTurn,
  turnNumber,
  timeRemaining,
  opponentWallet,
  isBotMatch,
  isLoading,
  isPolling,
  lastRoll,
  initiative,
  onAttack,
  onSurrender,
}) => {
  const navigate = useNavigate();
  const { adjustDelay } = useBattleSpeed();
  const [selectedPair, setSelectedPair] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
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
  
  // Refs for dice positions (for attack animation trajectory)
  const playerDiceRef = useRef<HTMLDivElement>(null);
  const opponentDiceRef = useRef<HTMLDivElement>(null);

  // Damage indicators
  const [myDamages, setMyDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());
  const [opponentDamages, setOpponentDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());

  // Hide initiative after 3 seconds
  useEffect(() => {
    if (showInitiative) {
      const timer = setTimeout(() => setShowInitiative(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showInitiative]);

  // Handle dice roll animation when lastRoll changes
  useEffect(() => {
    if (lastRoll) {
      setDiceKey((prev) => prev + 1);
      setIsDiceRolling(true);
      
      // Set highlighting for attacking/defending pairs
      if (lastRoll.source === "player") {
        const attackerIdx = lastAttackerIndex ?? 0;
        const targetIdx = lastTargetIndex ?? 0;
        setAttackingPairIndex(attackerIdx);
        setDefendingPairIndex(targetIdx);
        setAttackingTeam("my");
      } else {
        // Opponent attacking - find first alive pair as target
        const targetIdx = myPairs.findIndex(p => p.currentHealth > 0);
        const opponentAttackerIdx = opponentPairs.findIndex(p => p.currentHealth > 0);
        setAttackingPairIndex(opponentAttackerIdx >= 0 ? opponentAttackerIdx : 0);
        setDefendingPairIndex(targetIdx >= 0 ? targetIdx : 0);
        setAttackingTeam("opponent");
      }
      
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

      const stopTimer = setTimeout(() => {
        setIsDiceRolling(false);
        
        // Stop attack animation
        setAttackAnimation({ isActive: false, type: 'normal', source: 'player', damage: 0 });
        
        // Clear highlighting
        setAttackingPairIndex(null);
        setDefendingPairIndex(null);
        setAttackingTeam(null);

        // Show damage indicator on correct card
        if (lastRoll.source === "player") {
          // Player attacked opponent - show damage on target card
          const targetIdx = lastTargetIndex ?? 0;
          if (lastRoll.damage > 0 || lastRoll.isMiss) {
            setOpponentDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(targetIdx, {
                damage: lastRoll.damage,
                isCritical: lastRoll.isCritical,
                isBlocked: lastRoll.isMiss,
                key: Date.now(),
              });
              return newMap;
            });
          }
          // Handle counterattack damage to player - show on attacker card
          if (lastRoll.isCounterAttack && lastRoll.counterAttackDamage && lastRoll.counterAttackDamage > 0) {
            const attackerIdx = lastAttackerIndex ?? 0;
            setMyDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(attackerIdx, {
                damage: lastRoll.counterAttackDamage!,
                isCritical: false,
                isBlocked: false,
                key: Date.now() + 1,
              });
              return newMap;
            });
          }
        } else {
          // Opponent attacked player - find first alive pair as target
          const targetIdx = myPairs.findIndex(p => p.currentHealth > 0);
          if (lastRoll.damage > 0 || lastRoll.isMiss) {
            setMyDamages((prev) => {
              const newMap = new Map(prev);
              newMap.set(targetIdx >= 0 ? targetIdx : 0, {
                damage: lastRoll.damage,
                isCritical: lastRoll.isCritical,
                isBlocked: lastRoll.isMiss,
                key: Date.now(),
              });
              return newMap;
            });
          }
        }
      }, adjustDelay(2000));

      return () => clearTimeout(stopTimer);
    }
  }, [lastRoll, adjustDelay, lastAttackerIndex, lastTargetIndex, myPairs, opponentPairs]);

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
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
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
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                <PvPUnitImage
                  unit={{
                    ...pair.dragon,
                    rarity: pair.dragon.rarity,
                  }}
                  unitType="dragon"
                  alt={pair.dragon.name}
                  width={80}
                  height={80}
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
    
    const iWonInitiative = initiative.first_turn === "player1";
    
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
                  {initiative.player1_roll}
                </div>
              </div>
              <div className="text-2xl text-white/50">VS</div>
              <div className="text-center">
                <div className="text-white/70 text-sm mb-2">Противник</div>
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-3xl font-bold text-white shadow-lg">
                  {initiative.player2_roll}
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
    <div className="w-full h-full flex flex-col space-y-2 p-2">
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

            {/* Right - turn indicator and timer */}
            <div className="flex items-center gap-2 sm:absolute sm:right-0 sm:top-0">
              {isPolling && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
              <div
                className={`px-2 py-1 rounded text-xs sm:text-sm font-medium ${
                  isMyTurn ? "bg-green-500/80 text-white" : "bg-yellow-500/80 text-black"
                }`}
              >
                {isMyTurn ? "Ваш ход" : "Ход противника"}
              </div>
            </div>
          </div>

          {/* Timer */}
          {timeRemaining !== null && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <Clock className="w-4 h-4 text-white/70" />
              <span className={`text-lg font-mono ${timeRemaining < 30 ? "text-red-400" : "text-white"}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="flex-1 flex flex-col space-y-2 overflow-hidden">
        {/* My Team - Upper Part */}
        <Card variant="menu" className="flex-1 min-h-0" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
          <CardContent className="h-full overflow-y-auto overflow-x-hidden p-0.5 sm:p-1 pt-1 sm:pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5 sm:gap-1">
              {myPairs.map((pair, index) => renderPairCard(pair, index, true, myDamages.get(index)))}
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card variant="menu" className="flex-shrink-0 relative" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
          <CardContent className="py-2 sm:py-3 relative">
            {/* Attack Animation Overlay */}
            <AttackAnimation 
              isActive={attackAnimation.isActive}
              type={attackAnimation.type}
              source={attackAnimation.source}
              attackerPosition={attackAnimation.source === 'player' 
                ? { x: playerDiceRef.current?.offsetLeft ?? 50, y: playerDiceRef.current?.offsetTop ?? 20 }
                : { x: opponentDiceRef.current?.offsetLeft ?? 200, y: opponentDiceRef.current?.offsetTop ?? 20 }
              }
              defenderPosition={attackAnimation.source === 'player'
                ? { x: opponentDiceRef.current?.offsetLeft ?? 200, y: opponentDiceRef.current?.offsetTop ?? 20 }
                : { x: playerDiceRef.current?.offsetLeft ?? 50, y: playerDiceRef.current?.offsetTop ?? 20 }
              }
              damage={attackAnimation.damage}
            />
            
            <div className="flex flex-col items-center gap-2">
              {/* Single Dice Display (only attacker rolls now) */}
              <div className="flex items-center justify-center gap-4 w-full">
                {/* Player Dice with ref */}
                <div ref={playerDiceRef}>
                  <InlineDiceDisplay
                    key={`dice-${diceKey}`}
                    isRolling={isDiceRolling}
                    diceValue={lastRoll?.attackerRoll ?? null}
                    isAttacker={true}
                    label={isMyTurn ? "Ваш бросок" : (lastRoll?.source === "opponent" ? "Бросок противника" : "Ожидание...")}
                  />
                </div>

                {/* Attack Button */}
                {isMyTurn ? (
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
                ) : (
                  <div ref={opponentDiceRef} className="h-8 sm:h-10 flex items-center text-white/70 text-sm">Ожидание хода...</div>
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
