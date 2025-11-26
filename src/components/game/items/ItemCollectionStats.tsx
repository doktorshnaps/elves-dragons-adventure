import { Card } from "@/components/ui/card";
import { useItemInstancesContext } from "@/providers/ItemInstancesProvider";
import { useItemTemplates } from "@/hooks/useItemTemplates";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { BookOpen, Package } from "lucide-react";

export const ItemCollectionStats = () => {
  const { language } = useLanguage();
  const { instances } = useItemInstancesContext();
  const { templates } = useItemTemplates();

  // Получаем все шаблоны предметов
  const allItems = Array.from(templates.values());
  const totalItems = allItems.length;

  // Получаем уникальные template_id предметов, которые есть у игрока
  const uniqueItemTemplates = new Set(
    instances
      .filter(instance => instance.template_id !== null)
      .map(instance => instance.template_id)
  );

  const foundItems = uniqueItemTemplates.size;
  const percentage = totalItems > 0 ? Math.round((foundItems / totalItems) * 100) : 0;

  return (
    <Card variant="menu" className="p-4 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Package className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-white/60" />
            <span className="text-sm text-white/60">
              {t(language, 'grimoire.itemsCollection')}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {foundItems}
            </span>
            <span className="text-lg text-white/60">
              / {totalItems}
            </span>
            <span className="text-sm text-primary ml-auto">
              {percentage}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="mt-2 w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
