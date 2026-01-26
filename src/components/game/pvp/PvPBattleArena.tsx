import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import { Sword, Shield, Heart, ArrowLeft, Flag, Clock, Bot, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InlineDiceDisplay } from "../battle/InlineDiceDisplay";
import { DamageIndicator } from "../battle/DamageIndicator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { getCardImageByRarity, normalizeCardImageUrl } from "@/utils/cardImageResolver";

import { PvPPair } from "@/hooks/usePvP";

type PvPUnit = {
  name: string;
  faction?: string;
  image?: string;
  rarity?: number; // Добавить
};

const toLocalLovableUploads = (url: string): string | null => {
  // Convert Supabase public storage URL -> local public asset path
  // e.g. https://.../storage/v1/object/public/lovable-uploads/<file> -> /lovable-uploads/<file>
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

  // If snapshot has no image (common for old bot snapshots), resolve from card_images.
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
          // getCardImageByRarity uses (card as any).type
          type: unitType,
          rarity: unit.rarity || 1, // Использовать реальную rarity из снапшота
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
      // 1) If Supabase URL fails, try local public copy
      const local = prev ? toLocalLovableUploads(prev) : null;
      if (local && local !== prev) return local;
      // 2) Last resort: placeholder
      return placeholder;
    });
  };

  // If we already computed a local fallback, prefer it only after an error.
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
    defenderRoll: number;
    source: "player" | "opponent";
    damage: number;
    isBlocked: boolean;
    isCritical?: boolean;
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
  onAttack,
  onSurrender,
}) => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceKey, setDiceKey] = useState(0);

  // Damage indicators
  const [myDamages, setMyDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());
  const [opponentDamages, setOpponentDamages] = useState<
    Map<number, { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number }>
  >(new Map());

  // Handle dice roll animation when lastRoll changes
  useEffect(() => {
    if (lastRoll) {
      setDiceKey((prev) => prev + 1);
      setIsDiceRolling(true);

      const stopTimer = setTimeout(() => {
        setIsDiceRolling(false);

        // Show damage indicator
        if (lastRoll.source === "player") {
          // Player attacked opponent
          setOpponentDamages((prev) => {
            const newMap = new Map(prev);
            // Add damage to a random opponent pair for now
            newMap.set(0, {
              damage: lastRoll.damage,
              isCritical: lastRoll.isCritical,
              isBlocked: lastRoll.isBlocked,
              key: Date.now(),
            });
            return newMap;
          });
        } else {
          // Opponent attacked player
          setMyDamages((prev) => {
            const newMap = new Map(prev);
            newMap.set(0, {
              damage: lastRoll.damage,
              isCritical: lastRoll.isCritical,
              isBlocked: lastRoll.isBlocked,
              key: Date.now(),
            });
            return newMap;
          });
        }
      }, 1500);

      return () => clearTimeout(stopTimer);
    }
  }, [lastRoll]);

  const handleAttack = useCallback(async () => {
    if (selectedPair === null || selectedTarget === null) return;

    await onAttack(selectedPair, selectedTarget);
    setSelectedPair(null);
    setSelectedTarget(null);
  }, [selectedPair, selectedTarget, onAttack]);

  // Render a pair card (hero + dragon)
  const renderPairCard = (
    pair: PvPPair,
    index: number,
    isMyTeam: boolean,
    damageIndicator?: { damage: number; isCritical?: boolean; isBlocked?: boolean; key: number },
  ) => {
    const isSelected = isMyTeam ? selectedPair === index : selectedTarget === index;
    const isDead = pair.currentHealth <= 0;
    const healthPercent = pair.totalHealth > 0 ? (pair.currentHealth / pair.totalHealth) * 100 : 0;

    return (
      <div
        key={index}
        className={`relative p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border-2 transition-all cursor-pointer ${
          isDead
            ? "bg-black/30 border-white/30 opacity-50"
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
            {/* Hero Image - using same normalization as dungeons */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
              <PvPUnitImage
                unit={{
                  ...pair.hero,
                  rarity: pair.hero.rarity, // Если есть в снапшоте
                }}
                unitType="hero"
                alt={pair.hero.name}
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Dragon Image - using same normalization as dungeons */}
            {pair.dragon && (
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg overflow-hidden border border-white/30 bg-white/10 flex-shrink-0">
                <PvPUnitImage
                  unit={{
                    ...pair.dragon,
                    rarity: pair.dragon.rarity, // Если есть в снапшоте
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

  return (
    <div className="w-full h-full flex flex-col space-y-2 p-2">
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
        <Card variant="menu" className="flex-shrink-0" style={{ boxShadow: "-33px 15px 10px rgba(0, 0, 0, 0.6)" }}>
          <CardContent className="py-2 sm:py-3">
            <div className="flex flex-col items-center gap-2">
              {/* Dice Display */}
              <div className="flex items-center justify-center gap-4 w-full">
                {/* Player Dice */}
                <InlineDiceDisplay
                  key={`dice-left-${diceKey}`}
                  isRolling={isDiceRolling}
                  diceValue={
                    lastRoll ? (lastRoll.source === "player" ? lastRoll.attackerRoll : lastRoll.defenderRoll) : null
                  }
                  isAttacker={lastRoll ? lastRoll.source === "player" : true}
                  label="Игрок"
                />

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
                  <div className="h-8 sm:h-10 flex items-center text-white/70 text-sm">Ожидание хода...</div>
                )}

                {/* Opponent Dice */}
                <InlineDiceDisplay
                  key={`dice-right-${diceKey}`}
                  isRolling={isDiceRolling}
                  diceValue={
                    lastRoll ? (lastRoll.source === "player" ? lastRoll.defenderRoll : lastRoll.attackerRoll) : null
                  }
                  isAttacker={lastRoll ? lastRoll.source === "opponent" : false}
                  label="Противник"
                />
              </div>

              {/* Selection hints */}
              {isMyTurn && selectedPair === null && (
                <div className="text-[10px] sm:text-xs text-white/70">Выберите пару для атаки</div>
              )}
              {isMyTurn && selectedPair !== null && selectedTarget === null && (
                <div className="text-[10px] sm:text-xs text-white/70">Выберите цель для атаки</div>
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
