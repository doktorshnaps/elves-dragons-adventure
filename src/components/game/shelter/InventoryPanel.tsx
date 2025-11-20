import { Card } from "@/components/ui/card";
import { useItemInstances } from "@/hooks/useItemInstances";
import { getItemName, resolveItemKey } from "@/utils/itemNames";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { useMemo } from "react";
import { useTreasureHuntItems } from "@/hooks/useTreasureHuntItems";
import { Scroll } from "lucide-react";

export const InventoryPanel = () => {
  const { language } = useLanguage();
  const { instances } = useItemInstances();
  const { isQuestItem } = useTreasureHuntItems();
  
  // Группируем предметы по типу
  const groupedInventory = useMemo(() => {
    const groups: Record<string, { count: number; template_id?: number; isQuest: boolean }> = {};
    instances.forEach(inst => {
      const key = inst.name || inst.type || 'unknown';
      if (!groups[key]) {
        groups[key] = { count: 0, template_id: inst.template_id, isQuest: isQuestItem(inst.template_id) };
      }
      groups[key].count += 1;
    });
    return Object.entries(groups).map(([name, data]) => ({
      name,
      count: data.count,
      isQuest: data.isQuest,
      rarity: 'common',
      icon: '📦'
    }));
  }, [instances, isQuestItem]);

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
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            <span className="text-2xl">🎒</span>
            {t(language, 'inventory.title') || 'Инвентарь'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {instances.length} {t(language, 'inventory.items') || 'предметов'}
          </span>
        </div>

        <div className="space-y-2">
          {groupedInventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">{t(language, 'inventory.empty') || 'Инвентарь пуст'}</p>
            </div>
          ) : (
            groupedInventory.map((item, idx) => (
              <div
                key={idx}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2
                  bg-muted/20 hover:bg-muted/30 transition-all duration-200
                  ${getRarityClass(item.rarity)}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.isQuest && (
                        <div className="bg-purple-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Scroll className="w-3 h-3" />
                          Quest
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{item.rarity}</p>
                  </div>
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