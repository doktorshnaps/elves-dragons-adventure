import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { Item } from "@/types/inventory";

interface EquipmentTabsProps {
  onUseItem: (item: Item) => void;
}

export const EquipmentTabs = ({ onUseItem }: EquipmentTabsProps) => {
  return (
    <div className="w-full">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Инвентарь
          </h3>
          <p className="text-sm text-white/70 mb-4">
            Обычные предметы (не заминченные)
          </p>
          <InventoryDisplay onUseItem={onUseItem} readonly={false} />
        </div>
      </div>
    </div>
  );
};
