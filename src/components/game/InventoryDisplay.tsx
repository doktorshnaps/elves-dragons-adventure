import { Item } from "@/components/battle/Inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { useInventoryState } from "@/hooks/useInventoryState";
import { useToast } from "@/hooks/use-toast";

interface InventoryDisplayProps {
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
}

export const InventoryDisplay = ({ 
  onUseItem, 
  readonly = false 
}: InventoryDisplayProps) => {
  const { eggs } = useDragonEggs();
  const { inventory } = useInventoryState();
  const { toast } = useToast();
  const {
    balance,
    groupItems,
    handleSellItem,
  } = useInventoryLogic(inventory);

  const handleUseItem = (item: Item) => {
    if (!readonly && onUseItem) {
      if (item.type === 'cardPack') {
        toast({
          title: "Недоступно",
          description: "Колоды карт можно использовать только в магазине",
          variant: "destructive"
        });
        return;
      }
      onUseItem(item);
    }
  };

  return (
    <div 
      className="mt-4 relative rounded-lg overflow-hidden"
      style={{
        backgroundImage: 'url("/lovable-uploads/2eecde4e-bda9-4f8f-8105-3e6dcdff36fc.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="p-4">
        <InventoryHeader balance={balance} />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <DragonEggsList eggs={eggs} />
          <InventoryGrid
            groupedItems={groupItems(inventory)}
            readonly={readonly}
            onUseItem={(groupedItem) => {
              if (groupedItem.items.length > 0) {
                handleUseItem(groupedItem.items[0]);
              }
            }}
            onSellItem={handleSellItem}
          />
        </div>
      </div>
    </div>
  );
};