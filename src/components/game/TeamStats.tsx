import React from "react";
import { Card } from "@/components/ui/card";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { PlayerStats } from "@/types/battle";
import { TeamStatsSection } from "./stats/TeamStatsSection";
import { PlayerStatsSection } from "./stats/PlayerStatsSection";
import { calculateTeamStats } from "@/utils/cardUtils";

interface TeamStatsProps {
  teamStats: TeamStatsType;
}

export const TeamStats = ({ teamStats }: TeamStatsProps) => {
  const [playerStats, setPlayerStats] = React.useState<PlayerStats>(() => {
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
    const handleCardsUpdate = () => {
      const savedCards = localStorage.getItem('gameCards');
      if (savedCards) {
        const cards = JSON.parse(savedCards);
        const heroes = cards.filter(card => card.type === 'character');
        const pets = cards.filter(card => card.type === 'pet');
        
        const activePets = pets.filter(pet => {
          if (!pet.faction) return false;
          return heroes.some(hero => 
            hero.type === 'character' && 
            hero.faction === pet.faction && 
            hero.rarity >= pet.rarity
          );
        });

        const activeCards = [...heroes, ...activePets];
        const activeStats = calculateTeamStats(activeCards);

        setPlayerStats(prev => ({
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

    handleCardsUpdate();

    return () => {
      window.removeEventListener('cardsUpdate', handleCardsUpdate);
      window.removeEventListener('storage', handleCardsUpdate);
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
      <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-game-accent">Статистика</h2>
          <span className="text-sm text-game-accent">{balance} монет</span>
        </div>
        
        <div className="space-y-6">
          <TeamStatsSection teamStats={teamStats} />
          <PlayerStatsSection playerStats={playerStats} />
        </div>
      </div>
    </Card>
  );
};