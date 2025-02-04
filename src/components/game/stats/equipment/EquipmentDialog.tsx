import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ShopItem } from "@/components/shop/types";

interface EquipmentDialogProps {
  selectedSlot: string | null;
  availableItems: ShopItem[];
  onClose: () => void;
  onEquipItem: (item: ShopItem) => void;
}

export const EquipmentSelectionDialog = ({ 
  selectedSlot, 
  availableItems, 
  onClose, 
  onEquipItem 
}: EquipmentDialogProps) => {
  return (
    <Dialog open={selectedSlot !== null} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-accent">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-game-accent">
            Доступные предметы
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto">
          {availableItems.map((item) => (
            <Card 
              key={item.id}
              className="p-4 bg-game-surface/50 border-game-accent cursor-pointer hover:bg-game-surface/70"
              onClick={() => onEquipItem(item)}
            >
              <div className="flex flex-col items-center gap-2">
                {item.image && (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <span className="text-sm text-center text-game-accent">{item.name}</span>
                {item.stats && (
                  <div className="text-xs text-game-accent/80">
                    {item.stats.power && <div>Сила: +{item.stats.power}</div>}
                    {item.stats.defense && <div>Защита: +{item.stats.defense}</div>}
                    {item.stats.health && <div>Здоровье: +{item.stats.health}</div>}
                  </div>
                )}
              </div>
            </Card>
          ))}
          {availableItems.length === 0 && (
            <div className="col-span-full text-center text-game-accent">
              Нет доступных предметов для этого слота
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};