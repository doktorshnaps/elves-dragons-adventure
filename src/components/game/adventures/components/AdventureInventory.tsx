import { InventoryDisplay } from "../../InventoryDisplay";
import { Item } from "@/types/inventory";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface AdventureInventoryProps {
  onUseItem: (item: Item) => void;
}

export const AdventureInventory = ({ onUseItem }: AdventureInventoryProps) => {
  const { language } = useLanguage();
  
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-game-accent">{t(language, 'inventory.title')}</h3>
      <InventoryDisplay onUseItem={onUseItem} />
    </div>
  );
};