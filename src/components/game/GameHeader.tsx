import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, ChevronDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamStats as TeamStatsType } from "@/types/cards";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TeamStatsModal } from "./TeamStatsModal";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useGameStore } from "@/stores/gameStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { language } = useLanguage();
  const [showStats, setShowStats] = useState(false);
  const { toast } = useToast();
  
  // Получаем состояние боя из Zustand вместо localStorage
  const battleState = useGameStore((state) => state.battleState);
  const activeBattleInProgress = useGameStore((state) => state.activeBattleInProgress);
  
  const hasActiveBattle = activeBattleInProgress && battleState?.playerStats?.health > 0;

  const handleCloseStats = () => {
    setShowStats(false);
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex justify-between items-center w-full">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4"
          onClick={() => setShowShop(true)}
        >
          <ShoppingCart className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">
            {isMobile ? t(language, 'gameHeader.shop') : t(language, 'gameHeader.openShop')}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Menu className="h-4 w-4" />
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-game-surface border-game-accent">
            <DropdownMenuItem onClick={() => navigate('/dungeons')}>
              {t(language, 'gameHeader.dungeons')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowStats(true)}>
              {t(language, 'gameHeader.statistics')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/info')}>
              {t(language, 'gameHeader.information')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TeamStatsModal
        isOpen={showStats}
        onClose={handleCloseStats}
        teamStats={teamStats}
        balance={balance}
      />
    </div>
  );
};