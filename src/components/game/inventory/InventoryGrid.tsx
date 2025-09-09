import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Item } from "@/types/inventory";
import { GroupedItem } from "./types";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { getRarityDropRates } from "@/utils/cardUtils";
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
  const {
    language
  } = useLanguage();
  const unequippedItems = groupedItems.filter(item => !item.items.some(i => i.equipped));

  // Формируем единый ключ для группы (включая count)
  const keyFor = (g: GroupedItem) => `${g.name}-${g.type}-${g.value}-${g.count}`;

  // Авто-закрытие окна, если текущая группа предметов исчезла (например, после открытия последней колоды)
  useEffect(() => {
    if (!openKey) return;
    const stillExists = unequippedItems.some(g => keyFor(g) === openKey);
    if (!stillExists) setOpenKey(null);
  }, [unequippedItems, openKey]);
  if (unequippedItems.length === 0) {
    return <p className="text-gray-400 col-span-full text-center py-4 text-sm">{t(language, 'common.inventoryEmpty')}</p>;
  }
  return <>
      {unequippedItems.map(item => {
      const dialogKey = `${item.name}-${item.type}-${item.value}-${item.count}`;
      return <Dialog key={dialogKey} open={openKey === dialogKey} onOpenChange={open => setOpenKey(open ? dialogKey : null)}>
          <DialogTrigger asChild>
            <Card className="w-[80px] h-[90px] p-2 bg-game-surface/80 border-game-accent backdrop-blur-sm flex flex-col mx-1 my-1 cursor-pointer hover:border-game-accent/80">
              <div className="flex flex-col h-full">
                {item.type === 'dragon_egg' ? <div className="relative w-full h-[45px] mb-1 rounded-lg overflow-hidden bg-gray-800">
                    {item.items[0].image ? <img src={item.items[0].image} alt={item.name} className="w-full h-full object-contain opacity-50" /> : <img src="/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png" alt="Dragon Egg" className="w-full h-full object-contain opacity-50" />}
                  </div> : item.image && <div className="relative w-full h-[45px] mb-1 rounded-lg overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>}
                <div className="flex flex-col flex-grow">
                  <h4 className="font-bold text-game-accent text-[7px] truncate">
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h4>
                </div>
              </div>
            </Card>
          </DialogTrigger>
          <DialogContent className="bg-game-surface border-game-accent">
            
            
            <div className="space-y-4">
              <h4 className="font-semibold text-game-accent text-lg">{item.name}</h4>
              {item.type === 'cardPack' && <div className="space-y-3">
                  <p className="text-sm text-gray-400">{t(language, 'items.cardPackDescription')}</p>
                  <div className="bg-game-surface/50 p-3 rounded-lg border border-game-accent/30">
                    <h5 className="text-sm font-semibold text-game-accent mb-2">Шансы выпадения:</h5>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(getRarityDropRates()).map(([rarity, chance]) => <div key={rarity} className="flex justify-between items-center">
                          <span className="text-yellow-400">{"⭐".repeat(Number(rarity))}</span>
                          <span className="text-gray-300">{chance}</span>
                        </div>)}
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      <p>• 50% - Герой</p>
                      <p>• 50% - Питомец</p>
                    </div>
                  </div>
                </div>}
              {item.type === 'healthPotion' && <p className="text-sm text-gray-400">{t(language, 'items.healthPotionDescription', {
                value: String(item.value)
              })}</p>}
              {item.type === 'weapon' && item.items[0].stats && <div className="text-sm text-gray-400">
                  {item.items[0].stats.power && <p>{t(language, 'items.power')}: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>{t(language, 'items.defense')}: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>{t(language, 'items.health')}: +{item.items[0].stats.health}</p>}
                </div>}
              {item.type === 'armor' && item.items[0].stats && <div className="text-sm text-gray-400">
                  {item.items[0].stats.power && <p>{t(language, 'items.power')}: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>{t(language, 'items.defense')}: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>{t(language, 'items.health')}: +{item.items[0].stats.health}</p>}
                </div>}
              {item.type === 'dragon_egg' && <div className="text-sm text-gray-400">
                  <p>{t(language, 'items.rarity')}: {item.value}</p>
                  {item.items[0].petName && <p>{t(language, 'items.pet')}: {item.items[0].petName}</p>}
                </div>}
              {!readonly && <div className="flex flex-col gap-2 mt-4">
                  {item.type === 'cardPack' && <DialogClose asChild>
                      <Button onClick={() => onUseItem(item)} className="w-full bg-game-primary hover:bg-game-primary/80">
                        {t(language, 'items.openPack')}
                      </Button>
                    </DialogClose>}
                  {item.type === 'healthPotion' && <Button onClick={() => onUseItem(item)} variant="outline" className="w-full">
                      {t(language, 'items.use')}
                    </Button>}
                  {item.type === 'dragon_egg' && <Button onClick={() => onUseItem(item)} className="w-full bg-game-accent hover:bg-game-accent/80">
                      {t(language, 'items.startIncubation')}
                    </Button>}
                  {item.type !== 'dragon_egg' && <Button onClick={() => onSellItem(item)} variant="destructive" className="w-full">
                      {t(language, 'items.sell')}
                    </Button>}
                </div>}
            </div>
          </DialogContent>
        </Dialog>;
    })}
    </>;
};