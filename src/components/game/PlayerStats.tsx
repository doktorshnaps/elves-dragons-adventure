import React from "react";
import { TeamStats } from "./TeamStats";

interface PlayerStatsProps {
  balance: number;
  teamStats: {
    power: number;
    defense: number;
    health: number;
  };
}

export const PlayerStats: React.FC<PlayerStatsProps> = ({ teamStats }) => {
  return (
    <div className="flex gap-4 w-full">
      <TeamStats />
    </div>
  );
};