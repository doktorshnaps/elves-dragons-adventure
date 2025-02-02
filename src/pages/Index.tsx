import { GameTitle } from "@/components/GameTitle";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ShoppingCart, BookOpen, BarChart3 } from "lucide-react";
import { Shop } from "@/components/Shop";
import { TeamStatsModal } from "@/components/game/TeamStatsModal";
import { useBalanceState } from "@/hooks/useBalanceState";
import { calculateTeamStats } from "@/utils/cardUtils";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
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
      
      {/* Navigation Bar */}
      <div className="relative z-10 w-full p-4 flex justify-end gap-4">
        <Button
          variant="outline"
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/marketplace')}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Торговая площадка
        </Button>
        <Button
          variant="outline"
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/grimoire')}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Гримуар
        </Button>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-4">
          <GameTitle />
          
          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
              onClick={() => setShowShop(true)}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Открыть магазин
            </Button>
            <Button
              variant="outline"
              className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
              onClick={() => setShowStats(true)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Статистика
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
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