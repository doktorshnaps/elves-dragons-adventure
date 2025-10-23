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
  return (
    <Card variant="glassmorphic" className="sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="p-6 space-y-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            {t(language, 'inventory.title') || 'Инвентарь'}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {groupedInventory.length} {t(language, 'inventory.itemTypes') || 'типов предметов'}
          </p>
        </div>

        <div className="space-y-2">
          {groupedInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground opacity-60">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">{t(language, 'inventory.empty') || 'Инвентарь пуст'}</p>
            </div>
          ) : (
            groupedInventory.map((item, idx) => (
              <div
                key={idx}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2 
                  bg-muted/20 backdrop-blur-sm transition-all duration-200
                  hover:bg-muted/40 hover:scale-[1.02]
                  ${getRarityClass(item.rarity)}
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <span className="text-lg font-bold text-primary">×{item.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};