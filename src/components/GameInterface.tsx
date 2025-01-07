import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DungeonSearch } from "./DungeonSearch";
import { Shop } from "./Shop";
import { Item } from "./battle/Inventory";
import { InventoryDisplay } from "./game/InventoryDisplay";
import { DungeonsList } from "./game/DungeonsList";
import { GameHeader } from "./game/GameHeader";
import { PlayerStatsCard } from "./game/PlayerStats";
import { useToast } from "@/hooks/use-toast";

export const GameInterface = () => {
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
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

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
        const newBalance = e.newValue ? parseInt(e.newValue, 10) : 0;
        setBalance(newBalance);
      } else if (e.key === 'gameInventory') {
        const newInventory = e.newValue ? JSON.parse(e.newValue) : [];
        setInventory(newInventory);
      }
    };

    const handleInventoryUpdate = (e: CustomEvent<{ inventory: Item[] }>) => {
      setInventory(e.detail.inventory);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('inventoryUpdate', handleInventoryUpdate as EventListener);
    };
  }, []);

  const handleBalanceChange = (newBalance: number) => {
    setBalance(newBalance);
    localStorage.setItem('gameBalance', newBalance.toString());
  };

  const handleUseItem = (item: Item) => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (item.type === 'healthPotion') {
        const newHealth = Math.min(
          state.playerStats.health + item.value,
          state.playerStats.maxHealth
        );
        state.playerStats.health = newHealth;
        localStorage.setItem('battleState', JSON.stringify(state));
        
        const newInventory = inventory.filter(i => i.id !== item.id);
        setInventory(newInventory);
        localStorage.setItem('gameInventory', JSON.stringify(newInventory));
        
        toast({
          title: "Зелье использовано",
          description: `Восстановлено ${item.value} здоровья`,
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
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
      />

      <Tabs defaultValue="character" className="mt-8">
        <TabsList className="grid w-full grid-cols-2 bg-game-surface">
          <TabsTrigger value="character" className="text-game-accent">Персонаж</TabsTrigger>
          <TabsTrigger value="dungeons" className="text-game-accent">Подземелья</TabsTrigger>
        </TabsList>
        
        <TabsContent value="character">
          <PlayerStatsCard />
          <InventoryDisplay 
            inventory={inventory} 
            onUseItem={handleUseItem}
            readonly={false}
          />
        </TabsContent>
        
        <TabsContent value="dungeons">
          <DungeonsList />
        </TabsContent>
      </Tabs>

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