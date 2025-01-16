import { Button } from "@/components/ui/button";
import { Sword, ShoppingCart, BarChart2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
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
  const { toast } = useToast();

  const handleDungeonAction = () => {
    const savedState = localStorage.getItem('battleState');
    if (hasActiveDungeon && savedState) {
      const state = JSON.parse(savedState);
      if (state.selectedDungeon) {
        navigate('/battle');
      } else {
        // Если подземелье не выбрано, сбрасываем состояние
        localStorage.removeItem('battleState');
        setShowDungeonSearch(true);
        toast({
          title: "Подземелье не найдено",
          description: "Выберите новое подземелье для входа",
        });
      }
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