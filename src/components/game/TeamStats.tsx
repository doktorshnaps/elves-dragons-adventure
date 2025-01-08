import React from "react";
import { Card } from "@/components/ui/card";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStats } from "@/types/battle";

export const TeamStats = () => {
  const [stats, setStats] = React.useState<PlayerStats>(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.playerStats.health <= 0) {
        parsedState.playerStats.health = 10;
        localStorage.setItem('battleState', JSON.stringify(parsedState));
      }
      return parsedState.playerStats;
    }
    return {
      health: 100,
      maxHealth: 100,
      power: 20,
      defense: 10,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  React.useEffect(() => {
    const handleStorageChange = () => {
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setStats(state.playerStats);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const checkInterval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, []);

  return (
    <Card className="p-6 bg-game-surface border-game-accent mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-game-accent">Статистика команды</h2>
      </div>
      
      <div className="space-y-4">
        <HealthBar health={stats.health} maxHealth={stats.maxHealth} />
        <CombatStats power={stats.power} defense={stats.defense} />
      </div>
    </Card>
  );
};