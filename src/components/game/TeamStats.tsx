
import React from "react";
import { Card } from "@/components/ui/card";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { TeamStatsSection } from "./stats/TeamStatsSection";
import { calculateTeamStats } from "@/utils/cardUtils";
import { TeamStatsModal } from "./TeamStatsModal";
import { useTeamCards } from "@/hooks/team/useTeamCards";
import { useGameStore } from "@/stores/gameStore";

export const TeamStats = () => {
  const [showStats, setShowStats] = React.useState(false);
  const { cards } = useTeamCards();
  const teamStats = calculateTeamStats(cards);
  
  // Use Zustand store instead of localStorage
  const balance = useGameStore(state => state.balance);

  // No longer need effect - store updates automatically

  return (
    <>
      <Card 
        className="p-6 bg-game-surface border-game-accent mb-6 relative overflow-hidden cursor-pointer"
        onClick={() => setShowStats(true)}
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
            <span className="text-sm text-game-accent">{balance} ELL</span>
          </div>
          
          <div className="space-y-6">
            <TeamStatsSection teamStats={teamStats} />
          </div>
        </div>
      </Card>

      <TeamStatsModal 
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        teamStats={teamStats}
        balance={balance}
      />
    </>
  );
};

