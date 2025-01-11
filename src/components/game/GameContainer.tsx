import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/types/cards";
import { generatePack, calculateTeamStats } from "@/utils/cardUtils";
import { GameTabs } from "./GameTabs";
import { GameModals } from "./GameModals";
import { GameHeader } from "./GameHeader";
import { SocialQuests } from "./SocialQuests";

export const GameContainer = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('gameBalance');
    return savedBalance ? parseInt(savedBalance, 10) : 0;
  });
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(false);
  const [cards, setCards] = useState<Card[]>(() => {
    const savedCards = localStorage.getItem('gameCards');
    return savedCards ? JSON.parse(savedCards) : [];
  });

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

  const handleBalanceChange = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem('gameBalance', newBalance.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${isMobile ? 'p-2' : 'p-6'} max-w-7xl mx-auto`}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-2">
          <GameTabs cards={cards} />
        </div>
        <div className="md:col-span-1">
          <SocialQuests />
        </div>
      </div>

      <GameModals
        showDungeonSearch={showDungeonSearch}
        showShop={showShop}
        onCloseDungeon={() => setShowDungeonSearch(false)}
        onCloseShop={() => setShowShop(false)}
        balance={balance}
        onBalanceChange={handleBalanceChange}
      />
    </motion.div>
  );
};