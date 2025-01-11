import React from "react";
import { Card } from "@/components/ui/card";
import { TeamStats } from "./TeamStats";
import { useToast } from "@/hooks/use-toast";

interface PlayerStatsProps {
  balance: number;
  teamStats: {
    power: number;
    defense: number;
    health: number;
  };
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ balance, teamStats }) => {
  return (
    <div className="flex gap-4 w-full">
      <Card className="flex-1 p-4 bg-game-surface border-game-accent">
        <div className="flex items-center justify-between">
          <span className="text-game-accent">Баланс:</span>
          <span className="font-bold text-game-accent">{balance} монет</span>
        </div>
      </Card>
      <TeamStats />
    </div>
  );
};