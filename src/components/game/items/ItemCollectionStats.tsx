import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { BookOpen, Package, TrendingUp } from "lucide-react";
import { useGlobalItemStats } from "@/hooks/useGlobalItemStats";
import { ItemStatsModal } from "./ItemStatsModal";

export const ItemCollectionStats = () => {
  const { language } = useLanguage();
  const { data: globalStats = [], isLoading } = useGlobalItemStats();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Подсчитываем общее количество найденных предметов
  const totalFound = globalStats.reduce((sum, stat) => sum + stat.total_found, 0);
  const uniqueItems = globalStats.length;

  return (
    <>
      <Card 
        variant="menu" 
        className="p-4 mb-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">
                {t(language, 'grimoire.itemsGlobalStats')}
              </span>
              <TrendingUp className="w-3 h-3 text-primary ml-auto" />
            </div>
            
            {isLoading ? (
              <div className="text-white/60 text-sm">
                {t(language, 'common.loading')}...
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {totalFound}
                  </span>
                  <span className="text-sm text-white/60">
                    {t(language, 'grimoire.totalFound')}
                  </span>
                </div>
                
                <div className="mt-1 text-xs text-white/50">
                  {uniqueItems} {t(language, 'grimoire.uniqueVariants')}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <ItemStatsModal
        stats={globalStats}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
