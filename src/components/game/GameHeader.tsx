import { Button } from "@/components/ui/button";
import { Sword, ShoppingCart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlayerStats } from "./PlayerStats";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { useNavigate } from "react-router-dom";

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

  const handleDungeonAction = () => {
    if (hasActiveDungeon) {
      navigate('/battle');
    } else {
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
            {hasActiveDungeon 
              ? (isMobile ? "В подземелье" : "Вернуться в подземелье")
              : (isMobile ? "Подземелье" : "Поиск подземелья")
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
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PlayerStats balance={balance} teamStats={teamStats} />
      </div>
    </div>
  );
};