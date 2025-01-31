import { PlayerStats } from "@/types/battle";
import { HealthBar } from "./HealthBar";
import { CombatStats } from "./CombatStats";

interface PlayerStatsSectionProps {
  playerStats: PlayerStats;
}

export const PlayerStatsSection = ({ playerStats }: PlayerStatsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent">Характеристики игрока</h3>
      <HealthBar health={playerStats.health} maxHealth={playerStats.maxHealth} />
      <CombatStats power={playerStats.power} defense={playerStats.defense} />
    </div>
  );
};