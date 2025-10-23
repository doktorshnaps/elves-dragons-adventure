import { Card } from "@/components/ui/card";
import { useInventoryState } from "@/hooks/useInventoryState";
import { getItemName, resolveItemKey } from "@/utils/itemNames";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useMemo } from "react";

export const InventoryPanel = () => {
  const { language } = useLanguage();
  const { inventory } = useInventoryState();

  // Группируем предметы по типу и считаем количество
  const groupedInventory = useMemo(() => {
    const groups: Record<string, { name: string; count: number; rarity: string; icon: string }> = {};
    
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

  return (
    <Card 
      variant="glassmorphic"
      className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto"
    >
      <div className="p-5">
        <h3 className="text-lg font-semibold text-primary text-center mb-4 flex items-center justify-center gap-2">
          <span className="text-xl">🎒</span>
          {t(language, 'inventory.title') || 'Инвентарь'}
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {groupedInventory.length > 0 ? (
            groupedInventory.map((item, idx) => (
              <div
                key={idx}
                className={`
                  bg-muted/20 border-2 rounded-lg p-2 text-center 
                  transition-all duration-200 hover:scale-105 hover:bg-muted/30
                  ${getRarityClass(item.rarity)}
                `}
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-[10px] text-muted-foreground mb-1 truncate">
                  {item.name}
                </div>
                <div className="text-sm font-bold text-primary">
                  {item.count}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
              {t(language, 'inventory.empty') || 'Инвентарь пуст'}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
