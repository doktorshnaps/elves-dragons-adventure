import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, Sword } from "lucide-react";
import { PlayerStats } from "@/types/battle";

interface PlayerCardsProps {
  stats: PlayerStats;
  isPlayerTurn: boolean;
  onAttack: (enemyId: number) => void;
}

export const PlayerCards = ({ stats }: PlayerCardsProps) => {
  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold text-game-accent mb-4">Ваш герой</h3>
      <Card className="p-4 bg-game-surface border-game-accent">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sword className="w-4 h-4" />
              <span className="text-gray-400">Сила: {stats.power}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="text-gray-400">Защита: {stats.defense}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Здоровье: {stats.health}/{stats.maxHealth}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-gray-400">
              <span>Опыт: {stats.experience}/{stats.requiredExperience}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(stats.experience / stats.requiredExperience) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};