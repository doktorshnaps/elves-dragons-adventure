import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";
import { useToast } from "@/hooks/use-toast";
import { useEquipment } from "@/hooks/useEquipment";
import { SellItemDialog } from "./SellItemDialog";
import { UpgradeItemDialog } from "./UpgradeItemDialog";
import { InventoryHeader } from "./inventory/InventoryHeader";
import { InventoryList } from "./inventory/InventoryList";

interface InventoryDisplayProps {
  inventory: (Item | Equipment)[];
  onUseItem?: (item: Item) => void;
  readonly?: boolean;
  onBalanceChange?: (newBalance: number) => void;
}

export const InventoryDisplay = ({ 
  inventory, 
  onUseItem, 
  readonly = false,
  onBalanceChange 
}: InventoryDisplayProps) => {
  const { toast } = useToast();
  const { handleEquip } = useEquipment();
  const [showSellDialog, setShowSellDialog] = useState<Item | Equipment | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const handleUseItem = (item: Item | Equipment) => {
    if ('equipped' in item) {
      handleEquip(item as Equipment);
    } else if (onUseItem) {
      onUseItem(item as Item);
    }
  };

  const handleSellItem = (item: Item | Equipment, price: number) => {
    const newInventory = inventory.filter(i => i !== item);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    const currentBalance = parseInt(localStorage.getItem('gameBalance') || '0', 10);
    const newBalance = currentBalance + price;
    localStorage.setItem('gameBalance', newBalance.toString());
    
    if (onBalanceChange) {
      onBalanceChange(newBalance);
    }

    window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory } 
    }));
  };

  const handleUpgradeItems = ([item1, item2]: [Item | Equipment, Item | Equipment]) => {
    const newInventory = inventory.filter(i => i !== item1 && i !== item2);
    
    const upgradedItem = {
      ...item1,
      id: Date.now(),
      name: `Улучшенный ${item1.name}`,
      value: 'value' in item1 ? Math.floor(item1.value * 1.5) : undefined,
      power: 'power' in item1 ? Math.floor((item1.power || 0) * 1.5) : undefined,
      defense: 'defense' in item1 ? Math.floor((item1.defense || 0) * 1.5) : undefined,
    };
    
    newInventory.push(upgradedItem);
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    window.dispatchEvent(new CustomEvent('inventoryUpdate', { 
      detail: { inventory: newInventory } 
    }));
  };

  return (
    <Card className="bg-game-surface border-game-accent p-6">
      <InventoryHeader 
        onUpgrade={() => setShowUpgradeDialog(true)}
        readonly={readonly}
      />
      
      <InventoryList
        items={inventory}
        readonly={readonly}
        onUseItem={handleUseItem}
        onSellItem={(item) => setShowSellDialog(item)}
      />

      {showSellDialog && (
        <SellItemDialog
          item={showSellDialog}
          onSell={handleSellItem}
          onClose={() => setShowSellDialog(null)}
        />
      )}

      {showUpgradeDialog && (
        <UpgradeItemDialog
          items={inventory}
          onUpgrade={handleUpgradeItems}
          onClose={() => setShowUpgradeDialog(false)}
        />
      )}
    </Card>
  );
};