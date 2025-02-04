import { Card } from "@/components/ui/card";
import { ShopItem } from "@/components/shop/types";

interface EquipmentSlotProps {
  slot: string;
  title: string;
  item?: ShopItem;
  onSlotClick: (slot: string, item?: ShopItem) => void;
}

export const EquipmentSlot = ({ slot, title, item, onSlotClick }: EquipmentSlotProps) => {
  return (
    <Card 
      key={slot} 
      className="p-2 bg-game-surface/50 border-game-accent min-h-[50px] w-[50px] flex flex-col items-center justify-center cursor-pointer hover:bg-game-surface/70"
      onClick={() => onSlotClick(slot, item)}
    >
      {item ? (
        <>
          <img 
            src={item.image} 
            alt={item.name}
            className="w-6 h-6 object-contain"
          />
          <span className="text-[10px] text-center mt-1 text-game-accent leading-tight line-clamp-1">
            {item.name}
          </span>
        </>
      ) : (
        <span className="text-[10px] text-center text-game-accent/50">{title}</span>
      )}
    </Card>
  );
};