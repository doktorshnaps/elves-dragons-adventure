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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundImage: 'url("/lovable-uploads/5ca70a73-7a3f-415d-910b-ad1e310acf05.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="w-full max-w-2xl p-4">
        <Card className="bg-game-surface/90 border-game-accent p-6 w-full relative">
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
              <CardAnimation card={lastOpenedCard} />
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>
    </div>
  );
};