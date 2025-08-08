import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CardDisplay } from "../CardDisplay";
import { MarketplaceListing } from "./types";
import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";
import { supabase } from "@/integrations/supabase/client";

interface ListingDialogProps {
  onClose: () => void;
  onCreateListing: (listing: MarketplaceListing) => void;
}

export const ListingDialog = ({ onClose, onCreateListing }: ListingDialogProps) => {
  const [selectedType, setSelectedType] = useState<'card' | 'item'>('card');
  const [price, setPrice] = useState('');
  const [selectedItem, setSelectedItem] = useState<CardType | Item | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return;
        const { data, error } = await supabase
          .from('game_data')
          .select('cards, inventory, selected_team')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) {
          const teamIds = new Set<string>();
          const st = (data.selected_team as any[]) || [];
          st.forEach((slot: any) => {
            const heroId = slot?.hero?.id || slot?.hero?.id;
            const dragonId = slot?.dragon?.id || slot?.dragon?.id;
            if (heroId) teamIds.add(heroId);
            if (dragonId) teamIds.add(dragonId);
          });
          const allCards: CardType[] = (data.cards as any[]) || [];
          const filteredCards = allCards.filter((c) => !teamIds.has(c.id));
          setCards(filteredCards);
          setInventory(((data.inventory as any[]) || []) as Item[]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const [cards, setCards] = useState<CardType[]>([]);
  const [inventory, setInventory] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl mx-4">
        <Card className="bg-game-surface border-game-accent p-4 max-h-[70vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-white">Создать объявление</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={selectedType === 'card' ? 'default' : 'outline'}
                onClick={() => setSelectedType('card')}
                className="flex-1"
                size="sm"
              >
                Карты
              </Button>
              <Button
                variant={selectedType === 'item' ? 'default' : 'outline'}
                onClick={() => setSelectedType('item')}
                className="flex-1"
                size="sm"
              >
                Предметы
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto">
              {selectedType === 'card'
                ? cards.map((card: CardType, index: number) => renderItem(card, index))
                : inventory.map((item: Item, index: number) => renderItem(item, index))
              }
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">Цена (в ELL)</label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="1"
                className="bg-game-background border-game-accent h-8 text-sm"
              />
            </div>

            <Button
              onClick={handleCreate}
              disabled={!selectedItem || !price || loading}
              className="w-full bg-game-accent hover:bg-game-accent/80"
              size="sm"
            >
              Создать объявление
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};