import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generatePack, getRarityLabel } from "@/utils/cardUtils";
import { Card as CardType } from "@/types/cards";
import { ShopItem as ShopItemComponent } from "./shop/ShopItem";
import { CardAnimation } from "./shop/CardAnimation";
import { shopItems, ShopItem } from "./shop/types";

interface ShopProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const Shop = ({ onClose, balance, onBalanceChange }: ShopProps) => {
  const { toast } = useToast();
  const [showCardAnimation, setShowCardAnimation] = useState(false);
  const [lastOpenedCard, setLastOpenedCard] = useState<CardType | null>(null);

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
      
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(inventoryEvent);
    }

    const newBalance = balance - item.price;
    onBalanceChange(newBalance);
    const balanceEvent = new CustomEvent('balanceUpdate', { 
      detail: { balance: newBalance }
    });
    window.dispatchEvent(balanceEvent);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url("/lovable-uploads/aefc7995-4fc9-459a-8c89-b648a2799937.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      <Card className="relative z-10 bg-game-surface/80 border-game-accent p-4 w-full max-w-md max-h-[40vh] overflow-y-auto">
        <Button
          variant="ghost"
          className="absolute right-2 top-2 text-white hover:text-game-accent bg-game-surface/50"
          onClick={onClose}
        >
          <X className="h-3 w-3" />
        </Button>

        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-1 bg-game-surface/50 p-1 rounded-lg">
          <Sparkles className="w-4 h-4" />
          Магический магазин
        </h2>
        <p className="text-sm text-white mb-3 bg-game-surface/50 p-1 rounded-lg">Баланс: {balance} токенов</p>

        <AnimatePresence>
          {showCardAnimation && lastOpenedCard && (
            <CardAnimation card={lastOpenedCard} />
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {shopItems.map((item) => (
            <motion.div
              key={item.id}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <ShopItemComponent
                item={item}
                balance={balance}
                onBuy={buyItem}
              />
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};