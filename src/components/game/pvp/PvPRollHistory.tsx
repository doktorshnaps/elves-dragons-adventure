import React from "react";
import { Sword, Shield, Dices, User, Bot } from "lucide-react";

export interface RollHistoryEntry {
  id: number;
  source: "player" | "opponent";
  diceRoll: number;
  dicePercent: number;
  attackerPower: number;
  defenderDefense: number;
  modifiedPower: number;
  netDamage: number;
  isMiss: boolean;
  isCritical: boolean;
  isCounterAttack: boolean;
  counterAttackDamage?: number;
  attackerName: string;
  targetName: string;
}

const getDiceColor = (roll: number): string => {
  switch (roll) {
    case 1: return "text-red-400";
    case 2: return "text-orange-400";
    case 3: return "text-yellow-400";
    case 4: return "text-green-400";
    case 5: return "text-blue-400";
    case 6: return "text-purple-400";
    default: return "text-white";
  }
};

const getDiceLabel = (roll: number): string => {
  switch (roll) {
    case 1: return "Крит. промах";
    case 2: return "Промах";
    case 3: return "Слабый (50%)";
    case 4: return "Норм. (100%)";
    case 5: return "Сильный (150%)";
    case 6: return "Крит! (200%)";
    default: return "";
  }
};

const RollEntry: React.FC<{ entry: RollHistoryEntry; index: number }> = ({ entry, index }) => {
  const isPlayer = entry.source === "player";
  const borderColor = isPlayer ? "border-green-500/40" : "border-red-500/40";
  const bgColor = isPlayer ? "bg-green-500/5" : "bg-red-500/5";
  const iconColor = isPlayer ? "text-green-400" : "text-red-400";

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor} p-2 space-y-1.5 text-[10px] sm:text-xs`}>
      {/* Header: who attacked */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {isPlayer ? (
            <User className={`w-3 h-3 ${iconColor}`} />
          ) : (
            <Bot className={`w-3 h-3 ${iconColor}`} />
          )}
          <span className={`font-semibold ${iconColor}`}>
            {isPlayer ? "Вы" : "Противник"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Dices className={`w-3 h-3 ${getDiceColor(entry.diceRoll)}`} />
          <span className={`font-bold text-sm ${getDiceColor(entry.diceRoll)}`}>
            {entry.diceRoll}
          </span>
        </div>
      </div>

      {/* Dice result label */}
      <div className={`text-center font-medium ${getDiceColor(entry.diceRoll)}`}>
        {getDiceLabel(entry.diceRoll)}
      </div>

      {/* Damage calculation breakdown */}
      {!entry.isMiss ? (
        <div className="space-y-0.5 text-white/80 font-mono">
          {/* Line 1: Power × Multiplier */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-0.5">
              <Sword className="w-2.5 h-2.5 text-yellow-400" />
              Сила
            </span>
            <span>{entry.attackerPower} × {entry.dicePercent}%</span>
          </div>
          {/* Line 2: Modified power */}
          <div className="flex items-center justify-between">
            <span className="text-white/60">= Урон</span>
            <span className="text-yellow-300">{entry.modifiedPower}</span>
          </div>
          {/* Line 3: Minus defense */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5 text-blue-400" />
              Броня
            </span>
            <span className="text-blue-300">−{entry.defenderDefense}</span>
          </div>
          {/* Line 4: Net damage */}
          <div className="flex items-center justify-between border-t border-white/10 pt-0.5 mt-0.5">
            <span className="font-semibold text-white">Чистый урон</span>
            <span className={`font-bold ${entry.isCritical ? "text-purple-400" : "text-red-400"}`}>
              {entry.netDamage}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center text-white/50 italic">
          Урон: 0
        </div>
      )}

      {/* Counterattack info */}
      {entry.isCounterAttack && (
        <div className="border-t border-white/10 pt-1 mt-1">
          <div className="text-red-400 text-center font-medium">
            ⚔️ Контратака: {entry.counterAttackDamage ?? 0} урона
          </div>
        </div>
      )}

      {/* Target info */}
      <div className="text-white/40 text-center truncate">
        {entry.attackerName} → {entry.targetName}
      </div>
    </div>
  );
};

interface PvPRollHistoryProps {
  history: RollHistoryEntry[];
}

export const PvPRollHistory: React.FC<PvPRollHistoryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="text-[10px] sm:text-xs text-white/50 text-center font-medium uppercase tracking-wider">
        Последние броски
      </div>
      {history.map((entry, idx) => (
        <RollEntry key={entry.id} entry={entry} index={idx} />
      ))}
    </div>
  );
};
