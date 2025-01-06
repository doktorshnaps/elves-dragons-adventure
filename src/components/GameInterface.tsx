import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet2, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DungeonSearch } from "./DungeonSearch";
import { Shop } from "./Shop";
import { useNavigate } from "react-router-dom";

export const GameInterface = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('gameBalance');
    return savedBalance ? parseInt(savedBalance, 10) : 1000;
  });
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(false);
  const navigate = useNavigate();

  const checkDungeonState = () => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setHasActiveDungeon(parsedState.playerStats.health > 0);
      } catch (error) {
        console.error('Error parsing battle state:', error);
        setHasActiveDungeon(false);
      }
    } else {
      setHasActiveDungeon(false);
    }
  };

  useEffect(() => {
    checkDungeonState();
    
    const interval = setInterval(checkDungeonState, 1000);
    
    // Добавляем слушатель изменений в localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameBalance') {
        const newBalance = e.newValue ? parseInt(e.newValue, 10) : 1000;
        setBalance(newBalance);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleBalanceChange = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem('gameBalance', newBalance.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
            onClick={() => setIsConnected(!isConnected)}
          >
            <Wallet2 className="mr-2 h-4 w-4" />
            {isConnected ? "Connected" : "Connect Wallet"}
          </Button>
          
          <Card className="bg-game-surface border-game-accent p-4">
            <p className="text-game-accent">Баланс: {balance} токенов</p>
          </Card>

          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
            onClick={() => setShowShop(true)}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Магазин
          </Button>
        </div>

        {hasActiveDungeon ? (
          <Button
            className="bg-game-primary hover:bg-game-primary/80 text-white"
            onClick={() => navigate("/battle")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться в подземелье
          </Button>
        ) : (
          <Button
            className="bg-game-primary hover:bg-game-primary/80 text-white"
            onClick={() => setShowDungeonSearch(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Поиск подземелья
          </Button>
        )}
      </div>

      <Card className="bg-game-surface border-game-accent p-6">
        <h2 className="text-2xl font-bold text-game-accent mb-4">Инвентарь</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card
              key={i}
              className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 cursor-pointer"
            >
              <div className="aspect-[3/4] flex items-center justify-center">
                <p className="text-gray-400">Card Slot {i}</p>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {showDungeonSearch && (
        <DungeonSearch 
          onClose={() => setShowDungeonSearch(false)} 
          balance={balance}
          onBalanceChange={handleBalanceChange}
        />
      )}

      {showShop && (
        <Shop 
          onClose={() => setShowShop(false)} 
          balance={balance}
          onBalanceChange={handleBalanceChange}
        />
      )}
    </motion.div>
  );
};