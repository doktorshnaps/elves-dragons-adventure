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
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    let attempts = 0;
    const maxAttempts = 5;
    const attemptInterval = 1000; // 1 секунда между попытками

    const initializeGame = () => {
      console.log("Attempting to initialize Telegram WebApp...");
      if (window.Telegram?.WebApp) {
        console.log("Telegram WebApp found");
        try {
          const webApp = window.Telegram.WebApp;
          webApp.ready();
          const user = webApp.initDataUnsafe.user;
          if (user) {
            console.log("User found:", user);
            setIsInitialized(true);
            setIsLoading(false);
            return true;
          }
        } catch (error) {
          console.error("Error initializing Telegram WebApp:", error);
        }
      }
      return false;
    };

    const tryInitialize = () => {
      if (attempts >= maxAttempts) {
        console.log("Max attempts reached, stopping initialization");
        setIsLoading(false);
        return;
      }

      if (!initializeGame()) {
        attempts++;
        setTimeout(tryInitialize, attemptInterval);
      }
    };

    tryInitialize();

    return () => {
      attempts = maxAttempts; // Остановить попытки при размонтировании
    };
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

  if (!isInitialized) {
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