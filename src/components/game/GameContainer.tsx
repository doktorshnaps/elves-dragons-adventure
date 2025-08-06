import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { GameTabs } from "./GameTabs";
import { GameModals } from "./GameModals";
import { GameHeader } from "./GameHeader";
import { useGameData } from "@/hooks/useGameData";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { GameSkeleton } from "./loading/GameSkeleton";
import { useGameInitialization } from "./initialization/useGameInitialization";
import { FirstTimePackDialog } from "./initialization/FirstTimePackDialog";

const calculateTeamStats = (cards: Card[]) => {
  const stats = {
    power: cards.reduce((sum, card) => sum + card.power, 0),
    defense: cards.reduce((sum, card) => sum + card.defense, 0),
    health: cards.reduce((sum, card) => sum + card.health, 0)
  };
  
  return {
    ...stats,
    maxHealth: stats.health // Set maxHealth equal to health
  };
};

export const GameContainer = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { gameData, updateGameData } = useGameData();
  const balance = gameData.balance;
  const updateBalance = (newBalance: number) => updateGameData({ balance: newBalance });
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(false);
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const imagesLoaded = useImagePreloader();

  const { showFirstTimePack, setShowFirstTimePack } = useGameInitialization(setCards);

  useEffect(() => {
    return () => {
      localStorage.removeItem('battleState');
      toast({
        title: "Игра закрыта",
        description: "Подземелье автоматически завершено",
      });
    };
  }, [toast]);

  if (!imagesLoaded) {
    return <GameSkeleton />;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen w-full overflow-x-hidden"
      >
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2' : 'px-6'} py-4`}>
          <GameHeader
            balance={balance}
            hasActiveDungeon={hasActiveDungeon}
            setShowDungeonSearch={setShowDungeonSearch}
            setShowShop={setShowShop}
            teamStats={calculateTeamStats(cards)}
          />

          <div className="w-full mt-4">
            <GameTabs />
          </div>

          <GameModals
            showDungeonSearch={showDungeonSearch}
            showShop={showShop}
            onCloseDungeon={() => setShowDungeonSearch(false)}
            onCloseShop={() => setShowShop(false)}
            balance={balance}
            onBalanceChange={updateBalance}
          />

          <FirstTimePackDialog
            isOpen={showFirstTimePack}
            onClose={() => setShowFirstTimePack(false)}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};