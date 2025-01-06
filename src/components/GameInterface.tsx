import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet2, ArrowLeft, Search, ShoppingBag, Sword, Shield, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DungeonSearch } from "./DungeonSearch";
import { Shop } from "./Shop";
import { useNavigate } from "react-router-dom";
import { Item } from "./battle/Inventory";

interface GroupedItem {
  name: string;
  type: Item["type"];
  value: number;
  count: number;
  items: Item[];
}

export const GameInterface = () => {
  const [isConnected, setIsConnected] = useState(false);
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

  const getItemIcon = (type: Item["type"]) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <Shield className="w-4 h-4" />;
      case "healthPotion":
      case "defensePotion":
        return <Beaker className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return `+${item.value} к силе атаки`;
      case "armor":
        return `+${item.value} к защите`;
      case "healthPotion":
        return `Восстанавливает ${item.value} здоровья`;
      case "defensePotion":
        return `Восстанавливает ${item.value} защиты`;
    }
  };

  const groupItems = (items: Item[]): GroupedItem[] => {
    return items.reduce<GroupedItem[]>((acc, item) => {
      const existingGroup = acc.find(
        group => 
          group.name === item.name && 
          group.type === item.type && 
          group.value === item.value
      );

      if (existingGroup) {
        existingGroup.count += 1;
        existingGroup.items.push(item);
      } else {
        acc.push({
          name: item.name,
          type: item.type,
          value: item.value,
          count: 1,
          items: [item]
        });
      }

      return acc;
    }, []);
  };

  const handleUseItem = (groupedItem: GroupedItem) => {
    if (groupedItem.items.length > 0) {
      const itemToUse = groupedItem.items[0]; // Use the first item from the group
      onUseItem(itemToUse);
    }
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
          {inventory.length > 0 ? (
            groupItems(inventory).map((item) => (
              <Card
                key={`${item.name}-${item.type}-${item.value}`}
                className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getItemIcon(item.type)}
                  <h3 className="font-semibold text-game-accent">
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h3>
                </div>
                <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
              </Card>
            ))
          ) : (
            <p className="text-gray-400 col-span-3 text-center py-8">Инвентарь пуст</p>
          )}
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
