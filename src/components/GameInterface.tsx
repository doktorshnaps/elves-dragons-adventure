import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, ShoppingCart, BookOpen, BarChart3, Store, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamCards } from "./game/TeamCards";
import { EquipmentTab } from "./game/equipment/EquipmentTab";
import { Shop } from "./Shop";
import { DungeonSearch } from "./DungeonSearch";
import { useBalanceState } from "@/hooks/useBalanceState";
import { TeamStatsModal } from "./game/TeamStatsModal";
import { calculateTeamStats } from "@/utils/cardUtils";
import { useIsMobile } from "@/hooks/use-mobile";

export const GameInterface = () => {
  const navigate = useNavigate();
  const [showShop, setShowShop] = useState(false);
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showGameModeDialog, setShowGameModeDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [hasCards, setHasCards] = useState(false);
  const { balance, updateBalance } = useBalanceState();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkCards = () => {
      const savedCards = localStorage.getItem('gameCards');
      const cards = savedCards ? JSON.parse(savedCards) : [];
      setHasCards(cards.length > 0);
    };

    checkCards();
    window.addEventListener('cardsUpdate', checkCards);
    return () => window.removeEventListener('cardsUpdate', checkCards);
  }, []);

  const getTeamStats = () => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    return calculateTeamStats(cards);
  };

  return (
    <div className="min-h-screen p-1 sm:p-4 relative">
      <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-4 mb-2 sm:mb-6">
        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => setShowGameModeDialog(true)}
        >
          <Swords className="w-4 h-4" />
          {!isMobile && <span className="ml-2">БОЙ</span>}
        </Button>
        
        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => setShowShop(true)}
        >
          <ShoppingCart className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Открыть магазин</span>}
        </Button>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => navigate('/marketplace')}
        >
          <Store className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Торговая площадка</span>}
        </Button>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => setShowStats(true)}
        >
          <BarChart3 className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Статистика</span>}
        </Button>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => navigate('/grimoire')}
        >
          <BookOpen className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Гримуар</span>}
        </Button>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => setShowEquipment(true)}
        >
          <Shield className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Снаряжение</span>}
        </Button>

        <Button
          variant="outline"
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
          onClick={() => setShowTeam(true)}
        >
          <Users className="w-4 h-4" />
          {!isMobile && <span className="ml-2">Команда</span>}
        </Button>
      </div>

      {/* Game Mode Dialog */}
      <Dialog open={showGameModeDialog} onOpenChange={setShowGameModeDialog}>
        <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Выберите режим игры</DialogTitle>
            <DialogDescription>
              Выберите режим игры для продолжения
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <Button
              variant="outline"
              className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
              onClick={() => {
                setShowGameModeDialog(false);
                setShowDungeonSearch(true);
              }}
            >
              Поиск подземелья
            </Button>
            <Button
              variant="outline"
              className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
              onClick={() => {
                setShowGameModeDialog(false);
                navigate('/adventure');
              }}
            >
              Приключение
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equipment Dialog */}
      <Dialog open={showEquipment} onOpenChange={setShowEquipment}>
        <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Снаряжение</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <EquipmentTab />
          </div>
        </DialogContent>
      </Dialog>

      {/* Team Dialog */}
      <Dialog open={showTeam} onOpenChange={setShowTeam}>
        <DialogContent className="bg-game-surface border-game-accent max-w-[95vw] sm:max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Ваша команда</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <TeamCards />
          </div>
        </DialogContent>
      </Dialog>

      {/* Shop Modal */}
      {showShop && (
        <Shop
          onClose={() => setShowShop(false)}
          balance={balance}
          onBalanceChange={updateBalance}
        />
      )}

      {/* Stats Modal */}
      <TeamStatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        teamStats={getTeamStats()}
        balance={balance}
      />

      {/* Dungeon Search Modal */}
      {showDungeonSearch && (
        <DungeonSearch
          onClose={() => setShowDungeonSearch(false)}
          balance={balance}
          onBalanceChange={updateBalance}
        />
      )}
    </div>
  );
};
