import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { generatePack, calculateTeamStats } from "@/utils/cardUtils";
import { GameTabs } from "./GameTabs";
import { GameModals } from "./GameModals";
import { GameHeader } from "./GameHeader";
import { useBalanceState } from "@/hooks/useBalanceState";

export const GameContainer = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { balance, updateBalance } = useBalanceState();
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(() => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      return state.playerStats && state.playerStats.health > 0;
    }
    return false;
  });
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

  useEffect(() => {
    const checkDungeonState = () => {
      const savedState = localStorage.getItem('battleState');
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`container mx-auto ${isMobile ? 'px-2' : 'px-6'} py-4`}
    >
      <GameHeader
        isConnected={isConnected}
        setIsConnected={setIsConnected}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
        balance={balance}
        hasActiveDungeon={hasActiveDungeon}
        setShowDungeonSearch={setShowDungeonSearch}
        setShowShop={setShowShop}
        teamStats={calculateTeamStats(cards)}
      />

      <div className="w-full max-w-7xl mx-auto">
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
    </motion.div>
  );
};