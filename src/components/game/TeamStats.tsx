import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStats } from "@/types/battle";
import { TeamStats as TeamStatsType } from "@/types/cards";

interface TeamStatsProps {
  teamStats: TeamStatsType;
}

export const TeamStats = ({ teamStats }: TeamStatsProps) => {
  const [stats, setStats] = React.useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.playerStats;
    }
    
    return {
      health: 100,
      maxHealth: 100,
      power: 10,
      defense: 5,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  const [balance, setBalance] = React.useState(() => {
    return Number(localStorage.getItem('gameBalance') || '0');
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setStats(state.playerStats);
      }

      const newBalance = Number(localStorage.getItem('gameBalance') || '0');
      setBalance(newBalance);
    };

    const events = [
      'storage',
      'battleStateUpdate',
      'inventoryUpdate'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleStorageChange);
    });

    const checkInterval = setInterval(handleStorageChange, 500);

    handleStorageChange();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleStorageChange);
      });
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <Card className="p-6 bg-game-surface border-game-accent mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-game-accent">Статистика команды</h2>
        <span className="text-sm text-game-accent">{balance} монет</span>
      </div>
      
      <div className="space-y-4">
        <HealthBar health={stats.health} maxHealth={stats.maxHealth} />
        <CombatStats power={teamStats.power} defense={teamStats.defense} />
      </div>
    </Card>
  );
};