import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Item } from "@/types/inventory";
import { GroupedItem } from "./types";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { getRarityDropRates } from "@/utils/cardUtils";
import { workerImagesByName } from "@/constants/workerImages";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const unequippedItems = groupedItems
    .filter(item => !item.items.some(i => i.equipped))
    .sort((a, b) => {
      // Card packs always come first
      if (a.type === 'cardPack' && b.type !== 'cardPack') return -1;
      if (a.type !== 'cardPack' && b.type === 'cardPack') return 1;
      return 0;
    });

  const resolveGroupImage = (g: GroupedItem) => {
    // Special handling for workers
    if (g.type === 'worker' && workerImagesByName[g.name]) {
      return workerImagesByName[g.name];
    }
    
    // Try to get image from grouped item data
    const itemImage = g.image || g.items[0]?.image;
    
    // Return the image if it exists, otherwise placeholder
    return itemImage || '/placeholder.svg';
  };

  // Формируем единый ключ для группы (включая count и первый id для уникальности)
  const keyFor = (g: GroupedItem) => `${g.name}-${g.type}-${g.value}-${g.count}-${g.items[0]?.id || ''}`;

  // Авто-закрытие окна, если текущая группа предметов исчезла (например, после открытия последней колоды)
  useEffect(() => {
    if (!openKey) return;
    const stillExists = unequippedItems.some(g => keyFor(g) === openKey);
    if (!stillExists) setOpenKey(null);
  }, [unequippedItems, openKey]);
  if (unequippedItems.length === 0) {
    return <p className="text-gray-300 col-span-full text-center py-4 text-sm">{t(language, 'common.inventoryEmpty')}</p>;
  }
  return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {unequippedItems.map(item => {
      const dialogKey = `${item.name}-${item.type}-${item.value}-${item.count}-${item.items[0]?.id || ''}`;
      return <Dialog key={dialogKey} open={openKey === dialogKey} onOpenChange={open => setOpenKey(open ? dialogKey : null)}>
            <DialogTrigger asChild>
              <Card 
                variant="menu"
                className="p-4 transition-all duration-300 flex flex-col cursor-pointer hover:scale-105"
                style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}
              >
                <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-black/30 border border-white/20">
                  {(() => {
                    const imageSrc = resolveGroupImage(item);
                    return (
                      <img 
                        src={imageSrc} 
                        alt={item.name} 
                        className="w-full h-full object-contain" 
                        onError={(e) => { 
                          (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; 
                        }} 
                      />
                    );
                  })()}
                </div>

                <div className="flex flex-col">
                  <h3 className={`font-semibold text-white mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {item.name} {item.count > 1 && `(${item.count})`}
                  </h3>
                  <p className={`text-gray-300 ${isMobile ? 'text-[10px] line-clamp-2' : 'text-xs'}`}>
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
          <DialogContent className="bg-black/90 border-2 border-white backdrop-blur-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
            
            
            <div className="space-y-4">
              <h4 className="font-semibold text-white text-lg">{item.name}</h4>
              {item.type === 'cardPack' && <div className="space-y-3">
                  <p className="text-sm text-gray-300">{t(language, 'items.cardPackDescription')}</p>
                  <div className="bg-black/50 p-3 rounded-3xl border-2 border-white/30">
                    <h5 className="text-sm font-semibold text-white mb-2">Шансы выпадения:</h5>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {Object.entries(getRarityDropRates()).map(([rarity, chance]) => <div key={rarity} className="flex justify-between items-center">
                          <span className="text-yellow-400">{"⭐".repeat(Number(rarity))}</span>
                          <span className="text-gray-300">{chance}</span>
                        </div>)}
                    </div>
                    <div className="mt-2 text-xs text-gray-300">
                      <p>• 50% - Герой</p>
                      <p>• 50% - Питомец</p>
                    </div>
                  </div>
                </div>}
              {item.type === 'healthPotion' && <p className="text-sm text-gray-300">{t(language, 'items.healthPotionDescription', {
                value: String(item.value)
              })}</p>}
              {item.type === 'weapon' && item.items[0].stats && <div className="text-sm text-gray-300">
                  {item.items[0].stats.power && <p>{t(language, 'items.power')}: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>{t(language, 'items.defense')}: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>{t(language, 'items.health')}: +{item.items[0].stats.health}</p>}
                </div>}
              {item.type === 'armor' && item.items[0].stats && <div className="text-sm text-gray-300">
                  {item.items[0].stats.power && <p>{t(language, 'items.power')}: +{item.items[0].stats.power}</p>}
                  {item.items[0].stats.defense && <p>{t(language, 'items.defense')}: +{item.items[0].stats.defense}</p>}
                  {item.items[0].stats.health && <p>{t(language, 'items.health')}: +{item.items[0].stats.health}</p>}
                 </div>}
              {item.type === 'worker' && item.items[0].stats && <div className="text-sm text-gray-300">
                  <p>{t(language, 'items.speedBoost')}: +{item.value}%</p>
                  {item.items[0].stats.workDuration && <p>{t(language, 'items.workDuration')}: {Math.floor(item.items[0].stats.workDuration / 1000 / 60 / 60)} часов</p>}
                  {item.items[0].description && <p className="mt-1">{item.items[0].description}</p>}
                </div>}
              {item.type === 'dragon_egg' && <div className="text-sm text-gray-300">
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