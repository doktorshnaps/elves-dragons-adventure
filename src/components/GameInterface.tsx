import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet2, ArrowLeft, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DungeonSearch } from "./DungeonSearch";
import { Shop } from "./Shop";
import { useNavigate } from "react-router-dom";
import { Item } from "./battle/Inventory";
import { InventoryDisplay } from "./game/InventoryDisplay";
import { NFTGallery } from "./NFTGallery";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';

export const GameInterface = () => {
  const { isConnected } = useAccount();
  const { open } = useWeb3Modal();
  const [balance, setBalance] = useState(() => {
    const savedBalance = localStorage.getItem('gameBalance');
    return savedBalance ? parseInt(savedBalance, 10) : 1000;
  });
  const [showDungeonSearch, setShowDungeonSearch] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [hasActiveDungeon, setHasActiveDungeon] = useState(false);
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });
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
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gameBalance') {
        const newBalance = e.newValue ? parseInt(e.newValue, 10) : 1000;
        setBalance(newBalance);
      } else if (e.key === 'gameInventory') {
        const newInventory = e.newValue ? JSON.parse(e.newValue) : [];
        setInventory(newInventory);
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

  const handleUseItem = (item: Item) => {
    setInventory(prev => prev.filter(i => i.id !== item.id));
    localStorage.setItem('gameInventory', JSON.stringify(inventory.filter(i => i.id !== item.id)));
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
            onClick={() => open()}
          >
            <Wallet2 className="mr-2 h-4 w-4" />
            {isConnected ? "Кошелёк подключен" : "Подключить кошелёк"}
          </Button>
          
          <Card className="bg-game-surface border-game-accent p-4">
            <p className="text-game-accent">Баланс: {balance} монет</p>
          </Card>

          <Button
            variant="outline"
            className="bg-game-surface border-game-accent text-game-accent hover:bg-game-accent hover:text-white transition-all duration-300"
            onClick={() => setShowShop(true)}
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Магазин предметов
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
            Найти подземелье
          </Button>
        )}
      </div>

      {isConnected && <NFTGallery />}
      
      <InventoryDisplay inventory={inventory} onUseItem={handleUseItem} />

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