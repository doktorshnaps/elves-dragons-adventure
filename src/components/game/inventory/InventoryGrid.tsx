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

  // Формируем единый ключ для группы (включая count и первый id для уникальности)
  const keyFor = (g: GroupedItem) => `${g.name}-${g.type}-${g.value}-${g.count}-${g.items[0]?.id || ''}`;

  // Авто-закрытие окна, если текущая группа предметов исчезла (например, после открытия последней колоды)
  useEffect(() => {
    if (!openKey) return;
    const stillExists = unequippedItems.some(g => keyFor(g) === openKey);
    if (!stillExists) setOpenKey(null);
  }, [unequippedItems, openKey]);
  if (unequippedItems.length === 0) {
    return <p className="text-gray-400 col-span-full text-center py-4 text-sm">{t(language, 'common.inventoryEmpty')}</p>;
  }
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {unequippedItems.map(item => {
      const dialogKey = `${item.name}-${item.type}-${item.value}-${item.count}-${item.items[0]?.id || ''}`;
      return <Dialog key={dialogKey} open={openKey === dialogKey} onOpenChange={open => setOpenKey(open ? dialogKey : null)}>
            <DialogTrigger asChild>
              <Card className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-[320px] flex flex-col justify-between cursor-pointer">
                {item.image ? (
                  <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ) : item.type === 'dragon_egg' ? (
                  <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                    <img src={item.items[0].image || "/lovable-uploads/8a069dd4-47ad-496c-a248-f796257f9233.png"} alt="Dragon Egg" className="w-full h-full object-contain opacity-50" />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-game-accent text-sm mb-1">
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h3>
                  <p className="text-gray-400 text-xs flex-grow mb-1">
                    {item.type === 'worker' && `Ускорение: +${item.value}%`}
                    {item.type === 'cardPack' && 'Колода карт'}
                    {item.type === 'weapon' && 'Оружие'}
                    {item.type === 'armor' && 'Броня'}
                    {item.type === 'healthPotion' && `Восстанавливает ${item.value} HP`}
                    {item.type === 'dragon_egg' && 'Яйцо дракона'}
                  </p>
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
              {item.type === 'worker' && item.items[0].stats && <div className="text-sm text-gray-400">
                  <p>{t(language, 'items.speedBoost')}: +{item.value}%</p>
                  {item.items[0].stats.workDuration && <p>{t(language, 'items.workDuration')}: {Math.floor(item.items[0].stats.workDuration / 1000 / 60 / 60)} часов</p>}
                  {item.items[0].description && <p className="mt-1">{item.items[0].description}</p>}
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
    </div>;
};