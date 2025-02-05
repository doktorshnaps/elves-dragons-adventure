
import { Card } from "@/components/ui/card";
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
}

export const PlayerStatsCard = ({
  level,
  stats,
  experience,
  requiredExperience,
  playerHealth,
  maxHealth,
}: PlayerStatsCardProps) => {
  return (
    <Card className="p-6 bg-game-surface/95 border-game-accent">
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-6 h-6 text-yellow-500" />
          <span className="text-lg font-bold text-yellow-400">Уровень: {level}</span>
        </div>

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
          <ExperienceBar experience={experience} requiredExperience={requiredExperience} />
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
