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
import { useIsMobile } from "@/hooks/use-mobile";

interface ShopProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const Shop = ({ onClose, balance, onBalanceChange }: ShopProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
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

    if (item.requiredLevel) {
      const playerLevel = parseInt(localStorage.getItem('playerLevel') || '1');
      if (playerLevel < item.requiredLevel) {
        toast({
          title: "Недостаточный уровень",
          description: `Для покупки ${item.name} требуется ${item.requiredLevel} уровень`,
          variant: "destructive",
        });
        return;
      }
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
        id: Date.now().toString()
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
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ 
        touchAction: 'none',
        overscrollBehavior: 'none'
      }}
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
      <Card className="relative z-10 w-full h-full bg-game-surface/80 border-game-accent">
        <div className="p-4 flex items-center justify-between border-b border-game-accent">
          <h2 className="font-bold text-white flex items-center gap-1 bg-game-surface/50 p-2 rounded-lg">
            <Sparkles className="w-4 h-4" />
            Магический магазин
          </h2>
          <Button
            variant="ghost"
            className="text-white hover:text-game-accent bg-game-surface/50"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 bg-game-surface/50">
          <p className="text-white mb-3 bg-game-surface/50 p-2 rounded-lg">
            Баланс: {balance} токенов
          </p>
        </div>

        <AnimatePresence>
          {showCardAnimation && lastOpenedCard && (
            <CardAnimation card={lastOpenedCard} />
          )}
        </AnimatePresence>

        <div 
          className="flex-1 overflow-y-auto h-[calc(100vh-200px)]"
          style={{ 
            touchAction: 'pan-y',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            msOverflowStyle: '-ms-autohiding-scrollbar',
            scrollBehavior: 'smooth'
          }}
        >
          <div className="p-4">
            <div className={`grid gap-4 ${
              isMobile 
                ? 'grid-cols-2' 
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
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
          </div>
        </div>
      </Card>
    </motion.div>
  );
};