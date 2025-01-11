import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useToast } from "@/hooks/use-toast";
import { lootItems } from "@/utils/lootUtils";
import { generatePack, getRarityLabel, getCardPrice, getRarityDropRates } from "@/utils/cardUtils";
import { Card as CardType } from "@/types/cards";

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "healthPotion" | "defensePotion" | "weapon" | "armor" | "cardPack";
  value: number;
}

const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Колода карт",
    description: "Содержит 1 случайную карту героя или питомца",
    price: 1000,
    type: "cardPack",
    value: 1
  },
  {
    id: 2,
    name: lootItems.healthPotion.name,
    description: "Восстанавливает 30 очков здоровья",
    price: 50,
    type: "healthPotion",
    value: 30
  },
  {
    id: 3,
    name: lootItems.largeHealthPotion.name,
    description: "Восстанавливает 70 очков здоровья",
    price: 100,
    type: "healthPotion",
    value: 70
  },
  {
    id: 4,
    name: lootItems.defensePotion.name,
    description: "Увеличивает защиту на 20",
    price: 75,
    type: "defensePotion",
    value: 20
  },
  {
    id: 5,
    name: lootItems.weapon.name,
    description: "Увеличивает силу атаки на 15",
    price: 150,
    type: "weapon",
    value: 15
  },
  {
    id: 6,
    name: lootItems.armor.name,
    description: "Увеличивает защиту на 10",
    price: 120,
    type: "armor",
    value: 10
  }
];

interface ShopProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const Shop = ({ onClose, balance, onBalanceChange }: ShopProps) => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });
  const [showCardAnimation, setShowCardAnimation] = useState(false);
  const [lastOpenedCard, setLastOpenedCard] = useState<CardType | null>(null);

  const updateInventory = (newInventory: any[]) => {
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    setInventory(newInventory);
    
    const inventoryEvent = new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory }
    });
    window.dispatchEvent(inventoryEvent);
    
    const battleEvent = new CustomEvent('battleStateUpdate');
    window.dispatchEvent(battleEvent);
  };

  const buyItem = async (item: ShopItem) => {
    if (balance < item.price) {
      toast({
        title: "Недостаточно токенов",
        description: `Для покупки ${item.name} требуется ${item.price} токенов`,
        variant: "destructive",
      });
      return;
    }

    if (item.type === "cardPack") {
      const cards = generatePack();
      setLastOpenedCard(cards[0]);
      setShowCardAnimation(true);

      const savedCards = localStorage.getItem('gameCards') || '[]';
      const currentCards = JSON.parse(savedCards);
      const newCards = [...currentCards, ...cards];
      localStorage.setItem('gameCards', JSON.stringify(newCards));
      
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);

      toast({
        title: "Карта получена!",
        description: `Вы получили: ${cards[0].name} (${getRarityLabel(cards[0].rarity)})`,
      });

      setTimeout(() => {
        setShowCardAnimation(false);
        setLastOpenedCard(null);
      }, 2000);
    } else {
      const newItem = {
        ...item,
        id: Date.now()
      };
      const currentInventory = localStorage.getItem('gameInventory');
      const parsedInventory = currentInventory ? JSON.parse(currentInventory) : [];
      const newInventory = [...parsedInventory, newItem];
      updateInventory(newInventory);
    }

    const newBalance = balance - item.price;
    onBalanceChange(newBalance);
    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);
  };

  const renderShopItem = (item: ShopItem) => {
    const itemContent = (
      <Card
        className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300"
      >
        <h3 className="text-lg font-semibold text-game-accent mb-2">{item.name}</h3>
        <p className="text-gray-400 mb-2">{item.description}</p>
        <p className="text-game-secondary mb-4">Цена: {item.price} токенов</p>
        <Button
          className="w-full bg-game-primary hover:bg-game-primary/80"
          onClick={() => buyItem(item)}
          disabled={balance < item.price}
        >
          Купить
        </Button>
      </Card>
    );

    if (item.type === "cardPack") {
      const dropRates = getRarityDropRates();
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div>{itemContent}</div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 bg-game-background border-game-accent">
            <h4 className="text-game-accent font-semibold mb-2">Шансы выпадения:</h4>
            <div className="space-y-1">
              {Object.entries(dropRates).map(([rarity, chance]) => (
                <div key={rarity} className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {getRarityLabel(Number(rarity) as 1|2|3|4|5|6|7|8)}
                  </span>
                  <span className="text-game-accent">{chance}</span>
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return itemContent;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="bg-game-surface border-game-accent p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          className="absolute right-4 top-4 text-game-accent hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-2xl font-bold text-game-accent mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          Магический магазин
        </h2>
        <p className="text-game-accent mb-6">Баланс: {balance} токенов</p>

        <AnimatePresence>
          {showCardAnimation && lastOpenedCard && (
            <motion.div
              initial={{ scale: 0, rotateY: 180 }}
              animate={{ scale: 1, rotateY: 0 }}
              exit={{ scale: 0, rotateY: 180 }}
              transition={{ duration: 1 }}
              className="fixed inset-0 flex items-center justify-center z-50"
            >
              <Card className="p-6 bg-game-background border-game-accent animate-card-glow">
                <h3 className="text-xl font-bold text-game-accent mb-2">{lastOpenedCard.name}</h3>
                <p className="text-gray-400">Тип: {lastOpenedCard.type === 'character' ? 'Герой' : 'Питомец'}</p>
                <div className="mt-4 flex gap-4 justify-center">
                  <div className="text-game-accent">
                    <span>Атака: {lastOpenedCard.power}</span>
                  </div>
                  <div className="text-game-accent">
                    <span>Защита: {lastOpenedCard.defense}</span>
                  </div>
                  <div className="text-game-accent">
                    <span>Редкость: {getRarityLabel(lastOpenedCard.rarity)}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {renderShopItem(item)}
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};
