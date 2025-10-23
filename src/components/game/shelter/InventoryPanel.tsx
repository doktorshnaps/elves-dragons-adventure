import { Card } from "@/components/ui/card";
import { useInventoryState } from "@/hooks/useInventoryState";
import { getItemName, resolveItemKey } from "@/utils/itemNames";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useMemo } from "react";
export const InventoryPanel = () => {
  const {
    language
  } = useLanguage();
  const {
    inventory
  } = useInventoryState();

  // Группируем предметы по типу и считаем количество
  const groupedInventory = useMemo(() => {
    const groups: Record<string, {
      name: string;
      count: number;
      rarity: string;
      icon: string;
    }> = {};
    inventory.forEach(item => {
      const key = resolveItemKey(item.type);
      if (!groups[key]) {
        const itemData = item as any;
        groups[key] = {
          name: item.name || getItemName(key, language),
          count: 0,
          rarity: itemData.rarity || 'common',
          icon: itemData.icon || '📦'
        };
      }
      groups[key].count++;
    });
    return Object.values(groups);
  }, [inventory, language]);
  const getRarityClass = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return 'border-red-500/50 shadow-[0_0_8px_rgba(255,99,71,0.3)]';
      case 'rare':
        return 'border-yellow-500/50 shadow-[0_0_8px_rgba(218,165,32,0.3)]';
      case 'uncommon':
        return 'border-green-500/50 shadow-[0_0_8px_rgba(34,139,34,0.3)]';
      default:
        return 'border-muted';
    }
  };
  return;
};