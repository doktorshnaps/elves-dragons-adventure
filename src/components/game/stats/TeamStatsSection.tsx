import { TeamStats } from "@/types/cards";
import { HealthBar } from "./HealthBar";
import { CombatStats } from "./CombatStats";

interface TeamStatsSectionProps {
  teamStats: TeamStats;
}

export const TeamStatsSection = ({ teamStats }: TeamStatsSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-game-accent">Характеристики команды</h3>
      <HealthBar health={teamStats.health} maxHealth={teamStats.maxHealth} />
      <CombatStats power={teamStats.power} defense={teamStats.defense} />
    </div>
  );
};