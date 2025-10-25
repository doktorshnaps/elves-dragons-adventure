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
import { useGameStore } from "@/stores/gameStore";

const calculateTeamStats = (cards: Card[]) => {
  const power = cards.reduce((sum, c) => sum + (c.power || 0), 0);
  const defense = cards.reduce((sum, c) => sum + (c.defense || 0), 0);
  const maxHealth = cards.reduce((sum, c) => sum + (c.health || 0), 0);
  const health = cards.reduce((sum, c) => {
    const curr = typeof (c as any).currentHealth === 'number' ? (c as any).currentHealth : (c.health || 0);
    return sum + Math.min(curr, c.health || 0);
  }, 0);
  
  return { power, defense, health, maxHealth };
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
  const cards = useGameStore(state => state.cards);
  const setCards = useGameStore(state => state.setCards);

  const imagesLoaded = useImagePreloader();

  useGameInitialization(setCards);

  useEffect(() => {
    return () => {
      useGameStore.getState().clearBattleState();
      useGameStore.getState().setActiveBattleInProgress(false);
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

        </div>
      </motion.div>
    </AnimatePresence>
  );
};