import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getItemPrice } from "@/utils/itemUtils";

export interface Item {
  id: string;
  name: string;
  type: "cardPack" | "healthPotion" | "dragon_egg";
  value: number;
  description?: string;
  image?: string;
  petName?: string;
}

interface InventoryProps {
  items: Item[];
  onUseItem?: (item: Item) => void;
  onSellItem?: (item: Item) => void;
  readonly?: boolean;
}

export const Inventory = ({ 
  items, 
  onUseItem, 
  onSellItem,
  readonly = false 
}: InventoryProps) => {
  const { toast } = useToast();

  const handleSellItem = (item: Item) => {
    if (onSellItem) {
      const price = getItemPrice(item);
      onSellItem(item);
      toast({
        title: "Предмет продан",
        description: `Вы получили ${price} монет`,
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        Инвентарь пуст
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map((item) => (
        <Card 
          key={item.id}
          className="p-4 bg-game-surface border-game-accent"
        >
          <div className="space-y-2">
            {item.image && (
              <div className="w-full aspect-square mb-2 rounded-lg overflow-hidden">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="font-semibold text-game-accent">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-400">{item.description}</p>
            )}
            {!readonly && (
              <div className="space-y-2">
                {onUseItem && (
                  <Button
                    onClick={() => onUseItem(item)}
                    className="w-full"
                    variant="outline"
                  >
                    Использовать
                  </Button>
                )}
                {onSellItem && (
                  <Button
                    onClick={() => handleSellItem(item)}
                    className="w-full text-yellow-500 hover:text-yellow-600"
                    variant="outline"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Продать
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};