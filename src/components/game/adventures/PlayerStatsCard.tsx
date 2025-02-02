import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Sword, Shield } from "lucide-react";
import { ExperienceBar } from "../stats/ExperienceBar";

interface PlayerStatsCardProps {
  level: number;
  stats: {
    power: number;
    defense: number;
  };
  experience: number;
  requiredExperience: number;
  playerHealth: number;
  maxHealth: number;
  balance: number;
  onRestoreHealth: () => void;
}

export const PlayerStatsCard = ({
  level,
  stats,
  experience,
  requiredExperience,
  playerHealth,
  maxHealth,
  balance,
  onRestoreHealth
}: PlayerStatsCardProps) => {
  return (
    <Card className="p-4 bg-game-surface border-game-accent">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Sword className="w-5 h-5 text-game-accent" />
          <span className="text-sm">Сила: {stats.power}</span>
        </div>
        <div className="flex items-center gap-4">
          <Shield className="w-5 h-5 text-game-accent" />
          <span className="text-sm">Защита: {stats.defense}</span>
        </div>
        <ExperienceBar experience={experience} requiredExperience={requiredExperience} />
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div
            className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${(playerHealth / maxHealth) * 100}%` }}
          />
        </div>
        <Button
          variant="outline"
          onClick={onRestoreHealth}
          disabled={playerHealth >= maxHealth}
        >
          Восстановить здоровье (50 монет)
        </Button>
      </div>
    </Card>
  );
};