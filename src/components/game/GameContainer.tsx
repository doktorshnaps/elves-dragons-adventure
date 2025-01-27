import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { generatePack } from "@/utils/cardUtils";
import { GameTabs } from "./GameTabs";
import { GameModals } from "./GameModals";
import { GameHeader } from "./GameHeader";
import { useBalanceState } from "@/hooks/useBalanceState";
import { useImagePreloader } from "@/hooks/useImagePreloader";
import { Skeleton } from "@/components/ui/skeleton";

const calculateTeamStats = (cards: Card[]) => {
  return {
    power: cards.reduce((sum, card) => sum + card.power, 0),
    defense: cards.reduce((sum, card) => sum + card.defense, 0),
    health: cards.reduce((sum, card) => sum + card.health, 0)
  };
};

export const GameContainer = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { balance, updateBalance } = useBalanceState();
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(false);
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  const imagesLoaded = useImagePreloader();

  useEffect(() => {
    return () => {
      localStorage.removeItem('battleState');
      toast({
        title: "Игра закрыта",
        description: "Подземелье автоматически завершено",
      });
    };
  }, []);

  useEffect(() => {
    const isFirstLaunch = !localStorage.getItem('gameInitialized');
    if (isFirstLaunch) {
      const firstPack = generatePack();
      const secondPack = generatePack();
      const initialCards = [...firstPack, ...secondPack];
      
      localStorage.setItem('gameCards', JSON.stringify(initialCards));
      localStorage.setItem('gameInitialized', 'true');
      
      setCards(initialCards);
      
      toast({
        title: "Добро пожаловать в игру!",
        description: "Вы получили 2 начальные колоды карт",
      });
    }
  }, []);

  if (!imagesLoaded) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className={`max-w-7xl mx-auto ${isMobile ? 'px-2' : 'px-6'} py-4`}>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
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