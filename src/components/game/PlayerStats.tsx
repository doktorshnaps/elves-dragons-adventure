import { Card } from "@/components/ui/card";
import { TeamStats } from "@/types/cards";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";

interface PlayerStatsProps {
  balance: number;
  teamStats: TeamStats;
}

export const PlayerStats = ({ balance, teamStats }: PlayerStatsProps) => {
  return (
    <Card className="p-6 bg-game-surface border-game-accent">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-game-accent">Статистика команды</h2>
        <span className="text-2xl font-extrabold text-game-accent">{balance} монет</span>
      </div>
      
      <div className="space-y-4">
        <HealthBar health={teamStats.health} maxHealth={teamStats.health} />
        <CombatStats power={teamStats.power} defense={teamStats.defense} />
      </div>
    </Card>
  );
};