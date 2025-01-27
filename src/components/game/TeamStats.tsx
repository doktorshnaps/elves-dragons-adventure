import React from "react";
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
      health: teamStats.health,
      maxHealth: teamStats.health,
      power: teamStats.power,
      defense: teamStats.defense,
      experience: 0,
      level: 1,
      requiredExperience: 100
    };
  });

  const [balance, setBalance] = React.useState(() => {
    return Number(localStorage.getItem('gameBalance') || '0');
  });

  React.useEffect(() => {
    const handleBalanceUpdate = () => {
      const newBalance = Number(localStorage.getItem('gameBalance') || '0');
      setBalance(newBalance);
    };

    window.addEventListener('balanceUpdate', handleBalanceUpdate);
    window.addEventListener('storage', handleBalanceUpdate);

    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
      window.removeEventListener('storage', handleBalanceUpdate);
    };
  }, []);

  return (
    <Card 
      className="p-6 bg-game-surface border-game-accent mb-6 relative overflow-hidden"
      style={{
        backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Полупрозрачный оверлей для лучшей читаемости */}
      <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
      
      {/* Контент поверх оверлея */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-game-accent">Статистика команды</h2>
          <span className="text-sm text-game-accent">{balance} монет</span>
        </div>
        
        <div className="space-y-4">
          <HealthBar health={stats.health} maxHealth={stats.maxHealth} />
          <CombatStats power={stats.power} defense={stats.defense} />
        </div>
      </div>
    </Card>
  );
};