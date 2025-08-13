import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Item } from "@/types/inventory";
import { GroupedItem } from "./types";

interface InventoryGridProps {
  groupedItems: GroupedItem[];
  readonly: boolean;
  onUseItem: (groupedItem: GroupedItem) => Promise<boolean | void>;
  onSellItem: (groupedItem: GroupedItem) => void;
}

export const InventoryGrid = ({ 
  groupedItems, 
  readonly, 
  onUseItem, 
  onSellItem 
}: InventoryGridProps) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const unequippedItems = groupedItems.filter(item => 
    !item.items.some(i => i.equipped)
  );

  if (unequippedItems.length === 0) {
    return <p className="text-gray-400 col-span-full text-center py-4 text-sm">Инвентарь пуст</p>;
  }

  return (
    <>
      {unequippedItems.map((item) => {
        const dialogKey = `${item.name}-${item.type}-${item.value}`;
        return (
          <Dialog 
            key={dialogKey}
            open={openKey === dialogKey}
            onOpenChange={(open) => setOpenKey(open ? dialogKey : null)}
          >
          <DialogTrigger asChild>
            <Card 
              className="w-[80px] h-[90px] p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm flex flex-col mx-1 my-1 cursor-pointer hover:border-game-accent/80"
            >
              <div className="flex flex-col h-full">
                {item.type === 'dragon_egg' ? (
                  <div className="relative w-full h-[45px] mb-1 rounded-lg overflow-hidden bg-gray-800">
                    {item.items[0].image ? (
                      <img 
                        src={item.items[0].image}
                        alt={item.name}
                        className="w-full h-full object-contain opacity-50"
                      />
                    ) : (
                      <img 
                        src="/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png"
                        alt="Dragon Egg"
                        className="w-full h-full object-contain opacity-50"
                      />
                    )}
                  </div>
                ) : item.image && (
                  <div className="relative w-full h-[45px] mb-1 rounded-lg overflow-hidden">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-grow">
                  <h4 className="font-bold text-game-accent text-[7px] truncate">
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h4>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-game-surface border-game-accent">
            <DialogTitle className="text-game-accent">{item.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {item.type === 'cardPack' && 'Содержит 1 случайную карту героя или дракона'}
              {item.type === 'healthPotion' && `Восстанавливает ${item.value} единиц здоровья`}
              {item.type === 'dragon_egg' && (item.items[0].petName ? `Питомец: ${item.items[0].petName}` : 'Яйцо дракона')}
            </DialogDescription>
            <div className="space-y-4">
              <h4 className="font-semibold text-game-accent text-lg">{item.name}</h4>
              {item.type === 'cardPack' && (
                <p className="text-sm text-gray-400">Содержит 1 случайную карту героя или дракона</p>
              )}
              {item.type === 'healthPotion' && (
                <p className="text-sm text-gray-400">Восстанавливает {item.value} единиц здоровья</p>
              )}
              {item.type === 'weapon' && item.items[0].stats && (
                <div className="text-sm text-gray-400">
                  {item.items[0].stats.power && <p>Сила: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>Защита: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>Здоровье: +{item.items[0].stats.health}</p>}
                </div>
              )}
              {item.type === 'armor' && item.items[0].stats && (
                <div className="text-sm text-gray-400">
                  {item.items[0].stats.power && <p>Сила: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>Защита: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>Здоровье: +{item.items[0].stats.health}</p>}
                </div>
              )}
              {item.type === 'dragon_egg' && (
                <div className="text-sm text-gray-400">
                  <p>Редкость: {item.value}</p>
                  {item.items[0].petName && <p>Питомец: {item.items[0].petName}</p>}
                </div>
              )}
              {!readonly && (
                <div className="flex flex-col gap-2 mt-4">
                  {item.type === 'cardPack' && (
                    item.count === 1 ? (
                      <DialogClose asChild>
                        <Button
                          onClick={() => onUseItem(item)}
                          className="w-full bg-game-primary hover:bg-game-primary/80"
                        >
                          Открыть колоду
                        </Button>
                      </DialogClose>
                    ) : (
                      <Button
                        onClick={async () => {
                          const shouldClose = await onUseItem(item);
                          if (shouldClose) setOpenKey(null);
                        }}
                        className="w-full bg-game-primary hover:bg-game-primary/80"
                      >
                        Открыть колоду
                      </Button>
                    )
                  )}
                  {item.type === 'healthPotion' && (
                    <Button
                      onClick={() => onUseItem(item)}
                      variant="outline"
                      className="w-full"
                    >
                      Использовать
                    </Button>
                  )}
                  {item.type === 'dragon_egg' && (
                    <Button
                      onClick={() => onUseItem(item)}
                      className="w-full bg-game-accent hover:bg-game-accent/80"
                    >
                      Начать инкубацию
                    </Button>
                  )}
                  {item.type !== 'dragon_egg' && (
                    <Button
                      onClick={() => onSellItem(item)}
                      variant="destructive"
                      className="w-full"
                    >
                      Продать
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      );
      })}
    </>
  );
};

