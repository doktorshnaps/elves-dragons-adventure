import { Button } from "@/components/ui/button";
import { Sword, ShoppingCart, BarChart2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TeamStatsModal } from "./TeamStatsModal";
import { useToast } from "@/hooks/use-toast";

interface GameHeaderProps {
  balance: number;
  hasActiveDungeon: boolean;
  setShowDungeonSearch: (value: boolean) => void;
  setShowShop: (value: boolean) => void;
  teamStats: TeamStatsType;
}

export const GameHeader = ({
  balance,
  hasActiveDungeon,
  setShowDungeonSearch,
  setShowShop,
  teamStats,
}: GameHeaderProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showStats, setShowStats] = useState(false);
  const [hasActiveBattle, setHasActiveBattle] = useState(false);
  const { toast } = useToast();

  // Check for active dungeon on component mount
  useEffect(() => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      if (state.playerStats.health > 0) {
        setHasActiveBattle(true);
      }
    } else {
      setHasActiveBattle(false);
    }
  }, []);

  const handleDungeonAction = () => {
    const battleState = localStorage.getItem('battleState');
    if (battleState) {
      const state = JSON.parse(battleState);
      if (state.playerStats.health > 0) {
        // If there's an active dungeon, navigate to battle
        navigate('/battle');
      }
    } else {
      // If no active dungeon, show dungeon search
      setShowDungeonSearch(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDungeonAction}
          >
            <Sword className="w-4 h-4" />
            {isMobile ? 
              (hasActiveBattle ? "В подземелье" : "Подземелье") : 
              (hasActiveBattle ? "Вернуться в подземелье" : "Поиск подземелья")
            }
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowShop(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {isMobile ? "Магазин" : "Открыть магазин"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowStats(true)}
          >
            <BarChart2 className="w-4 h-4" />
            {isMobile ? "Статы" : "Статистика"}
          </Button>
        </div>
      </div>

      <TeamStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        teamStats={teamStats}
        balance={balance}
      />
    </div>
  );
};