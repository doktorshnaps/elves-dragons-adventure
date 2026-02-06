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
  const borderColor = isPlayer ? "border-green-500/30" : "border-red-500/30";
  const bgColor = isPlayer ? "bg-green-500/5" : "bg-red-500/5";
  const iconColor = isPlayer ? "text-green-400" : "text-red-400";

  return (
    <div className={`rounded border ${borderColor} ${bgColor} px-1.5 py-1 text-[9px] sm:text-[10px] leading-tight`}>
      {/* Header row: who + dice + label */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-0.5">
          {isPlayer ? <User className={`w-2.5 h-2.5 ${iconColor}`} /> : <Bot className={`w-2.5 h-2.5 ${iconColor}`} />}
          <span className={`font-semibold ${iconColor}`}>{isPlayer ? "Вы" : "Прот."}</span>
        </div>
        <span className={`font-medium ${getDiceColor(entry.diceRoll)}`}>{getDiceLabel(entry.diceRoll)}</span>
        <div className="flex items-center gap-0.5">
          <Dices className={`w-2.5 h-2.5 ${getDiceColor(entry.diceRoll)}`} />
          <span className={`font-bold text-xs ${getDiceColor(entry.diceRoll)}`}>{entry.diceRoll}</span>
        </div>
      </div>

      {/* Damage breakdown — compact single-line rows */}
      {!entry.isMiss ? (
        <div className="mt-0.5 font-mono text-white/80 space-y-px">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-0.5"><Sword className="w-2 h-2 text-yellow-400" />Сила</span>
            <span>{entry.attackerPower}×{entry.dicePercent}% = <span className="text-yellow-300">{entry.modifiedPower}</span></span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-0.5"><Shield className="w-2 h-2 text-blue-400" />Бр.</span>
            <span className="text-blue-300">−{entry.defenderDefense}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-px">
            <span className="font-semibold text-white">Итого</span>
            <span className={`font-bold ${entry.isCritical ? "text-purple-400" : "text-red-400"}`}>{entry.netDamage}</span>
          </div>
        </div>
      ) : (
        <div className="text-center text-white/50 italic mt-0.5">Урон: 0</div>
      )}

      {/* Counterattack */}
      {entry.isCounterAttack && (
        <div className="text-red-400 text-center font-medium mt-0.5 text-[9px]">⚔️ Контр: {entry.counterAttackDamage ?? 0}</div>
      )}

      {/* Target info */}
      <div className="text-white/30 text-center truncate mt-0.5">{entry.attackerName} → {entry.targetName}</div>
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
