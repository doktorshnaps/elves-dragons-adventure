import React from "react";
import { Card } from "@/components/ui/card";
import { HealthBar } from "./stats/HealthBar";
import { CombatStats } from "./stats/CombatStats";
import { PlayerStats } from "@/types/battle";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { calculateTeamStats } from "@/utils/cardUtils";
import { backgrounds } from "@/assets/dungeons";

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

  // Обновляем статистику при изменении карт
  React.useEffect(() => {
    const handleCardsUpdate = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const heroes = cards.filter(card => card.type === 'character');
        const pets = cards.filter(card => card.type === 'pet');
        
        // Проверяем активность питомцев
        const activePets = pets.filter(pet => {
          if (!pet.faction) return false;
          return heroes.some(hero => 
            hero.type === 'character' && 
            hero.faction === pet.faction && 
            hero.rarity >= pet.rarity
          );
        });

        // Рассчитываем статистику только для героев и активных питомцев
        const activeCards = [...heroes, ...activePets];
        const activeStats = calculateTeamStats(activeCards);

        setStats(prev => ({
          ...prev,
          health: activeStats.health,
          maxHealth: activeStats.health,
          power: activeStats.power,
          defense: activeStats.defense
        }));
      }
    };

    window.addEventListener('cardsUpdate', handleCardsUpdate);
    window.addEventListener('storage', handleCardsUpdate);

    // Инициализируем статистику при монтировании
    handleCardsUpdate();

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate);
      window.removeEventListener('storage', handleCardsUpdate);
    };
  }, []);

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
        backgroundImage: `url(${backgrounds.teamStats})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
      
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
