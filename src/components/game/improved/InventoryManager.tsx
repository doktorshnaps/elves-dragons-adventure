import { useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Item } from '@/types/inventory';
import { Package, Heart, Sparkles } from 'lucide-react';
import { generateCard } from '@/utils/cardUtils';
import { Badge } from '@/components/ui/badge';

interface GroupedItem {
  name: string;
  type: Item['type'];
  count: number;
  items: Item[];
  image?: string;
}

export const InventoryManager = () => {
  const { inventory, removeItem, addCard } = useGameStore();
  const { handleError, handleSuccess } = useErrorHandler();
  const [selectedItem, setSelectedItem] = useState<GroupedItem | null>(null);

  const groupItems = (items: Item[]): GroupedItem[] => {
    const groups = new Map<string, GroupedItem>();
    
    items.forEach(item => {
      const key = `${item.name}-${item.type}-${item.value}`;
      const existing = groups.get(key);
      
      if (existing) {
        existing.count++;
        existing.items.push(item);
      } else {
        groups.set(key, {
          name: item.name,
          type: item.type,
          count: 1,
          items: [item],
          image: item.image
        });
      }
    });
    
    return Array.from(groups.values());
  };

  const useItem = async (groupedItem: GroupedItem) => {
    try {
      const item = groupedItem.items[0];
      
      if (item.type === 'cardPack' || item.type === 'heroPack' || item.type === 'dragonPack') {
        // Открываем колоду карт
        const newCard = generateCard(Math.random() > 0.5 ? 'character' : 'pet');
        addCard(newCard);
        removeItem(item.id);
        
        handleSuccess(
          'Колода открыта!',
          `Получена карта: ${newCard.name} (${newCard.rarity}★)`
        );
      } else if (item.type === 'healthPotion') {
        // Зелья можно использовать только в бою
        handleError({ message: 'Зелья можно использовать только в подземелье' });
      }
    } catch (error) {
      handleError(error, 'useItem');
    }
  };

  const sellItem = (groupedItem: GroupedItem) => {
    try {
      const item = groupedItem.items[0];
      const sellPrice = Math.floor(item.value * 0.7);
      
      removeItem(item.id);
      useGameStore.getState().addBalance(sellPrice);
      
      handleSuccess(
        'Предмет продан',
        `Получено ${sellPrice} ELL`
      );
    } catch (error) {
      handleError(error, 'sellItem');
    }
  };

  const groupedItems = groupItems(inventory);

  const getItemIcon = (type: Item['type']) => {
    switch (type) {
      case 'cardPack': return <Sparkles className="w-4 h-4" />;
      case 'healthPotion': return <Heart className="w-4 h-4 text-red-500" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-game-accent" />
        <h3 className="text-xl font-bold text-game-accent">Инвентарь</h3>
        <Badge variant="secondary">{inventory.length} предметов</Badge>
      </div>

      {groupedItems.length === 0 ? (
        <Card className="p-8 bg-game-surface/50 border-game-accent">
          <div className="text-center text-game-accent/60">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Инвентарь пуст</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groupedItems.map((item, index) => (
            <Card
              key={`${item.name}-${item.type}-${index}`}
              className="p-3 bg-game-surface/80 border-game-accent cursor-pointer hover:border-game-primary transition-all"
              onClick={() => setSelectedItem(item)}
            >
              <div className="space-y-2">
                {item.image && (
                  <div className="w-full aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {getItemIcon(item.type)}
                    <span className="text-xs font-medium text-game-accent truncate">
                      {item.name}
                    </span>
                  </div>
                  
                  {item.count > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      x{item.count}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-game-surface border-game-accent">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-game-accent flex items-center gap-2">
                  {getItemIcon(selectedItem.type)}
                  {selectedItem.name}
                  {selectedItem.count > 1 && (
                    <Badge variant="secondary">x{selectedItem.count}</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedItem.image && (
                  <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden">
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="text-center space-y-2">
                  <p className="text-gray-400">
                    {(selectedItem.type === 'cardPack' || selectedItem.type === 'heroPack' || selectedItem.type === 'dragonPack') && 'Содержит 1 случайную карту'}
                    {selectedItem.type === 'healthPotion' && `Восстанавливает ${selectedItem.items[0]?.value} здоровья`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => useItem(selectedItem)}
                    className="flex-1 bg-game-primary hover:bg-game-primary/80"
                  >
                    Использовать
                  </Button>
                  <Button
                    onClick={() => sellItem(selectedItem)}
                    variant="outline"
                    className="flex-1"
                  >
                    Продать
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};