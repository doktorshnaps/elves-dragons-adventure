
import { Card } from "@/components/ui/card";
import { Sword, Shield } from "lucide-react";

interface PlayerStatsCardProps {
  stats: {
    power: number;
    defense: number;
  };
  playerHealth: number;
  maxHealth: number;
}

export const PlayerStatsCard = ({
  stats,
  playerHealth,
  maxHealth,
}: PlayerStatsCardProps) => {
  return (
    <Card className="p-6 bg-game-surface/95 border-game-accent">
      <div className="space-y-6">
        <div className="space-y-4 bg-black/40 p-4 rounded-lg">
          <div className="flex items-center gap-4">
            <Sword className="w-5 h-5 text-game-accent" />
            <span className="text-base text-gray-100">Сила: {stats.power}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Shield className="w-5 h-5 text-game-accent" />
            <span className="text-base text-gray-100">Защита: {stats.defense}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-gray-800 rounded-full h-2.5">
            <div
              className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(playerHealth / maxHealth) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-200">
            <span>HP: {playerHealth}</span>
            <span>/ {maxHealth}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
