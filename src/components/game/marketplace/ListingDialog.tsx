import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardDisplay } from "../CardDisplay";
import { MarketplaceListing } from "./types";
import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";

interface ListingDialogProps {
  onClose: () => void;
  onCreateListing: (listing: MarketplaceListing) => void;
}

export const ListingDialog = ({ onClose, onCreateListing }: ListingDialogProps) => {
  const [selectedType, setSelectedType] = useState<'card' | 'item'>('card');
  const [price, setPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState<CardType | Item | null>(null);

  const cards = JSON.parse(localStorage.getItem('gameCards') || '[]');
  const inventory = JSON.parse(localStorage.getItem('gameInventory') || '[]');

  const handleCreate = () => {
    if (!selectedItem || !price) return;

    const listing: MarketplaceListing = {
      id: Date.now().toString(),
      type: selectedType,
      item: selectedItem,
      price: Number(price),
      sellerId: 'current-user',
      createdAt: new Date().toISOString(),
    };

    if (selectedType === 'card') {
      const newCards = cards.filter((c: CardType) => c.id !== selectedItem.id);
      localStorage.setItem('gameCards', JSON.stringify(newCards));
      const cardsEvent = new CustomEvent('cardsUpdate', { 
        detail: { cards: newCards }
      });
      window.dispatchEvent(cardsEvent);
    } else {
      const newInventory = inventory.filter((i: Item) => i.id !== selectedItem.id);
      localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      const inventoryEvent = new CustomEvent('inventoryUpdate', { 
        detail: { inventory: newInventory }
      });
      window.dispatchEvent(inventoryEvent);
    }

    onCreateListing(listing);
  };

  const renderItem = (item: CardType | Item, index: number) => {
    if ('rarity' in item) {
      return (
        <div
          key={item.id}
          className={`cursor-pointer ${
            selectedItem?.id === item.id ? 'ring-2 ring-game-accent rounded-lg' : ''
          }`}
          onClick={() => setSelectedItem(item)}
        >
          <CardDisplay card={item as CardType} showSellButton={false} />
        </div>
      );
    } else {
      return (
        <Card
          key={item.id}
          className={`p-4 bg-game-surface border-game-accent cursor-pointer ${
            selectedItem?.id === item.id ? 'ring-2 ring-game-accent' : ''
          }`}
          onClick={() => setSelectedItem(item)}
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-game-accent">{item.name}</h3>
            <p className="text-sm text-gray-400">
              {item.type === 'healthPotion' ? 'Зелье здоровья' : 'Набор карт'}
            </p>
          </div>
        </Card>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl bg-game-surface border-game-accent p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Создать объявление</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              variant={selectedType === 'card' ? 'default' : 'outline'}
              onClick={() => setSelectedType('card')}
              className="flex-1"
            >
              Карты
            </Button>
            <Button
              variant={selectedType === 'item' ? 'default' : 'outline'}
              onClick={() => setSelectedType('item')}
              className="flex-1"
            >
              Предметы
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
            {selectedType === 'card'
              ? cards.map((card: CardType, index: number) => renderItem(card, index))
              : inventory.map((item: Item, index: number) => renderItem(item, index))
            }
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400">Цена (в токенах)</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="1"
              className="bg-game-background border-game-accent"
            />
          </div>

          <Button
            onClick={handleCreate}
            disabled={!selectedItem || !price}
            className="w-full bg-game-accent hover:bg-game-accent/80"
          >
            Создать объявление
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
