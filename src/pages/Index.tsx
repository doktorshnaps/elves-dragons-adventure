import { GameTitle } from "@/components/GameTitle";
import { useState } from "react";
import { Shop } from "@/components/Shop";
import { TeamStatsModal } from "@/components/game/TeamStatsModal";
import { useBalanceState } from "@/hooks/useBalanceState";
import { calculateTeamStats } from "@/utils/cardUtils";
import { NavigationBar } from "@/components/navigation/NavigationBar";
import { GameActions } from "@/components/game/GameActions";

const Index = () => {
  const [showShop, setShowShop] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { balance, updateBalance } = useBalanceState();

  const getTeamStats = () => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    return calculateTeamStats(cards);
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ 
        backgroundImage: 'url("/lovable-uploads/86b5334c-bb41-4222-9077-09521913b631.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <NavigationBar />

      <div className="relative z-10 flex-grow flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <GameTitle />
          <GameActions 
            onOpenShop={() => setShowShop(true)}
            onOpenStats={() => setShowStats(true)}
          />
        </div>
      </div>

      {showShop && (
        <Shop
          onClose={() => setShowShop(false)}
          balance={balance}
          onBalanceChange={updateBalance}
        />
      )}

      <TeamStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        teamStats={getTeamStats()}
        balance={balance}
      />
    </div>
  );
};

export default Index;