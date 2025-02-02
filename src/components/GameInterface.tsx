import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, ShoppingCart, Menu, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TeamStats } from "./game/TeamStats";
import { calculateTeamStats } from "@/utils/cardUtils";

export const GameInterface = () => {
  const navigate = useNavigate();
  const [showShop, setShowShop] = useState(false);
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showGameModeDialog, setShowGameModeDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [hasCards, setHasCards] = useState(false);
  const { balance, updateBalance } = useBalanceState();

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

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const getTeamStats = () => {
    const savedCards = localStorage.getItem('gameCards');
    const cards = savedCards ? JSON.parse(savedCards) : [];
    return calculateTeamStats(cards);
  };

  const handleCloseStatsDialog = () => {
    setShowStatsDialog(false);
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
            <Swords className="w-4 h-4 mr-2" />
            БОЙ
          </Button>
          
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
            onClick={() => setShowShop(true)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Открыть магазин
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="bg-game-surface border-game-accent text-game-accent">
              <Menu className="h-4 w-4 mr-2" />
              Меню
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-game-surface border-game-accent">
            <DropdownMenuItem onSelect={() => handleNavigation('/grimoire')}>
              Гримуар
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleNavigation('/marketplace')}>
              Торговая площадка
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setShowStatsDialog(true)}>
              Статистика
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                handleNavigation('/adventure');
              }}
            >
              Приключение
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={handleCloseStatsDialog}>
        <DialogContent className="bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">Статистика</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Просмотр характеристик вашей команды
            </DialogDescription>
          </DialogHeader>
          <TeamStats teamStats={getTeamStats()} />
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