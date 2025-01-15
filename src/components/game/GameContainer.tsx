import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { generatePack } from "@/utils/cardUtils";
import { GameTabs } from "./GameTabs";
import { GameModals } from "./GameModals";
import { GameHeader } from "./GameHeader";
import { useBalanceState } from "@/hooks/useBalanceState";
import { useTelegramUser } from "@/hooks/useTelegramUser";

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
  const { userId } = useTelegramUser();
  const { balance, updateBalance } = useBalanceState();
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const prefix = userId ? `user_${userId}_` : '';

  const [hasActiveDungeon, setHasActiveDungeon] = useState(() => {
    const savedState = localStorage.getItem(prefix + 'battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.playerStats && state.playerStats.health > 0;
    }
    return false;
  });

  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem(prefix + 'gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  useEffect(() => {
    // Add a small delay to allow Telegram WebApp to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const checkDungeonState = () => {
      const savedState = localStorage.getItem(prefix + 'battleState');
      if (savedState) {
        const state = JSON.parse(savedState);
        setHasActiveDungeon(state.playerStats && state.playerStats.health > 0);
      } else {
        setHasActiveDungeon(false);
      }
    };

    checkDungeonState();
    window.addEventListener('storage', checkDungeonState);
    
    return () => {
      window.removeEventListener('storage', checkDungeonState);
    };
  }, [userId, prefix]);

  useEffect(() => {
    if (!userId) return;

    const isFirstLaunch = !localStorage.getItem(prefix + 'gameInitialized');
    if (isFirstLaunch) {
      const firstPack = generatePack();
      const secondPack = generatePack();
      const initialCards = [...firstPack, ...secondPack];
      
      localStorage.setItem(prefix + 'gameCards', JSON.stringify(initialCards));
      localStorage.setItem(prefix + 'gameInitialized', 'true');
      
      setCards(initialCards);
      
      toast({
        title: "Добро пожаловать в игру!",
        description: "Вы получили 2 начальные колоды карт",
      });
    }
  }, [userId, prefix, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold mb-2">Загрузка...</h2>
          <p className="text-gray-600">Подождите, игра загружается</p>
        </div>
      </div>
    );
  }

  if (!userId && !isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-center p-4">
          <h2 className="text-xl font-bold mb-2">Ошибка доступа</h2>
          <p className="text-gray-600">Пожалуйста, откройте игру через Telegram</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
  );
};