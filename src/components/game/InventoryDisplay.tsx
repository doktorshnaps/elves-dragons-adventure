
import { Item } from "@/types/inventory";
import { useDragonEggs } from "@/contexts/DragonEggContext";
import { useInventoryLogic } from "./inventory/useInventoryLogic";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { DragonEggsList } from "./inventory/DragonEggsList";
import { InventoryGrid } from "./inventory/InventoryGrid";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { GroupedItem } from "./inventory/types";

interface InventoryDisplayProps {
  onUseItem?: (item: Item) => void;
  onSellItem?: (item: Item) => void;
  readonly?: boolean;
  showOnlyPotions?: boolean;
}

export const InventoryDisplay = ({ 
  onUseItem, 
  onSellItem,
  readonly = false,
  showOnlyPotions = false
}: InventoryDisplayProps) => {
  const { eggs } = useDragonEggs();
  const { gameData, updateGameData } = useGameData();
  const inventory = gameData.inventory || [];
  const { toast } = useToast();
  const {
    balance,
    groupItems,
    handleSellItem,
    handleOpenCardPack,
    isOpening
  } = useInventoryLogic(inventory);

  const handleUseItem = async (groupedItem: GroupedItem) => {
    if (!readonly && onUseItem && groupedItem.items.length > 0) {
      if (groupedItem.type === 'cardPack') {
        // Открываем колоду карт
        await handleOpenCardPack(groupedItem.items[0]);
        return;
      }

      const itemToUse = groupedItem.items[0];
      onUseItem(itemToUse);

      // Обновляем инвентарь после использования предмета
      const newInventory = inventory.filter(item => item.id !== itemToUse.id);
      await updateGameData({ inventory: newInventory });

      // Если это была последняя копия предмета в стопке
      if (groupedItem.count === 1) {
        toast({
          title: "Предмет использован",
          description: `${groupedItem.name} был использован`
        });
      } else {
        toast({
          title: "Предмет использован",
          description: `${groupedItem.name} был использован (осталось ${groupedItem.count - 1})`
        });
      }
    }
  };

  const handleGroupedSellItem = async (groupedItem: GroupedItem) => {
    if (groupedItem.items.length > 0 && onSellItem) {
      const itemToSell = groupedItem.items[0];
      onSellItem(itemToSell);
    } else if (groupedItem.items.length > 0) {
      await handleSellItem(groupedItem.items[0]);
      
      const newInventory = inventory.filter(item => item.id !== groupedItem.items[0].id);
      await updateGameData({ inventory: newInventory });
    }
  };

  const filteredInventory = showOnlyPotions 
    ? inventory.filter(item => item.type === 'healthPotion')
    : inventory;

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-1 gap-x-0.5">
          {!showOnlyPotions && <DragonEggsList eggs={eggs} />}
          <InventoryGrid
            groupedItems={groupItems(filteredInventory)}
            readonly={readonly}
            onUseItem={handleUseItem}
            onSellItem={handleGroupedSellItem}
          />
        </div>
      </div>
    </div>
  );
};
