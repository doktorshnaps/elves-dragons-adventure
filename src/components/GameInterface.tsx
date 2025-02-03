import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, ShoppingCart, BookOpen, BarChart3, Store } from "lucide-react";
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
    <div className="min-h-screen p-4 relative">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => setShowGameModeDialog(true)}
          >
            <Swords className="w-4 h-4" />
            {!isMobile && <span className="ml-2">БОЙ</span>}
          </Button>
          
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => setShowShop(true)}
          >
            <ShoppingCart className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Открыть магазин</span>}
          </Button>

          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => navigate('/marketplace')}
          >
            <Store className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Торговая площадка</span>}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => setShowStats(true)}
          >
            <BarChart3 className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Статистика</span>}
          </Button>

          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => navigate('/grimoire')}
          >
            <BookOpen className="w-4 h-4" />
            {!isMobile && <span className="ml-2">Гримуар</span>}
          </Button>
        </div>
      </div>

      {/* Main Content - Two Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hasCards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-game-surface/80 p-6 rounded-lg border border-game-accent"
          >
            <h2 className="text-xl font-bold text-game-accent mb-4">Ваша команда</h2>
            <TeamCards />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-game-surface/80 p-6 rounded-lg border border-game-accent"
        >
          <h2 className="text-xl font-bold text-game-accent mb-4">Снаряжение</h2>
          <EquipmentTab />
        </motion.div>
      </div>

      {/* Game Mode Dialog */}
      <Dialog open={showGameModeDialog} onOpenChange={setShowGameModeDialog}>
        <DialogContent className="bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Выберите режим игры</DialogTitle>
            <DialogDescription>
              Выберите режим игры для продолжения
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <Button
              variant="outline"
              className="h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
              onClick={() => {
                setShowGameModeDialog(false);
                setShowDungeonSearch(true);
              }}
            >
              Поиск подземелья
            </Button>
            <Button
              variant="outline"
              className="h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
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