import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStats } from "@/types/battle";
import { calculateTeamStats } from "@/utils/cardUtils";

export const TeamStats = () => {
  const [stats, setStats] = React.useState<PlayerStats>(() => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    const teamStats = calculateTeamStats(cards);
    
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      state.playerStats = {
        ...state.playerStats,
        power: teamStats.power,
        defense: teamStats.defense,
        health: teamStats.health,
        maxHealth: teamStats.health
      };
      localStorage.setItem('battleState', JSON.stringify(state));
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

  useEffect(() => {
    const handleStorageChange = () => {
      const savedCards = localStorage.getItem('gameCards');
      const cards = savedCards ? JSON.parse(savedCards) : [];
      const teamStats = calculateTeamStats(cards);
      
      const savedState = localStorage.getItem('battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        state.playerStats = {
          ...state.playerStats,
          power: teamStats.power,
          defense: teamStats.defense,
          health: teamStats.health,
          maxHealth: teamStats.health
        };
        localStorage.setItem('battleState', JSON.stringify(state));
        setStats(state.playerStats);
      }

      const newBalance = Number(localStorage.getItem('gameBalance') || '0');
      setBalance(newBalance);
    };

    // Add event listeners for various update events
    const events = [
      'storage',
      'cardsUpdate',
      'balanceUpdate',
      'battleStateUpdate',
      'inventoryUpdate'
    ];

    events.forEach(event => {
      window.addEventListener(event, handleStorageChange);
    });

    // More frequent updates (every 500ms)
    const checkInterval = setInterval(handleStorageChange, 500);

    // Immediate check on mount
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
        <CombatStats power={stats.power} defense={stats.defense} />
      </div>
    </Card>
  );
};