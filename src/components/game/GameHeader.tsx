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
        navigate('/battle');
      }
    } else {
      setShowDungeonSearch(true);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
          onClick={handleDungeonAction}
        >
          <Sword className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {isMobile ? 
              (hasActiveBattle ? "В подземелье" : "Подземелье") : 
              (hasActiveBattle ? "Вернуться в подземелье" : "Поиск подземелья")
            }
          </span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
          onClick={() => setShowShop(true)}
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {isMobile ? "Магазин" : "Открыть магазин"}
          </span>
        </Button>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
          onClick={() => setShowStats(true)}
        >
          <BarChart2 className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {isMobile ? "Статы" : "Статистика"}
          </span>
        </Button>
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