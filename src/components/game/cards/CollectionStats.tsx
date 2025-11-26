import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { BookOpen, Users, PawPrint, TrendingUp } from "lucide-react";
import { useGlobalCardStats } from "@/hooks/useGlobalCardStats";
import { CardStatsModal } from "./CardStatsModal";

interface CollectionStatsProps {
  type: 'character' | 'pet';
}

export const CollectionStats = ({ type }: CollectionStatsProps) => {
  const { language } = useLanguage();
  const { data: globalStats = [], isLoading } = useGlobalCardStats(type);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Подсчитываем общее количество найденных карт
  const totalFound = globalStats.reduce((sum, stat) => sum + stat.total_found, 0);
  const uniqueCards = globalStats.length;

  return (
    <>
      <Card 
        variant="menu" 
        className="p-4 mb-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            {type === 'character' ? (
              <Users className="w-6 h-6 text-primary" />
            ) : (
              <PawPrint className="w-6 h-6 text-primary" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-white/60" />
              <span className="text-sm text-white/60">
                {type === 'character' 
                  ? t(language, 'grimoire.heroesGlobalStats')
                  : t(language, 'grimoire.petsGlobalStats')
                }
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
                  {uniqueCards} {t(language, 'grimoire.uniqueVariants')}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      <CardStatsModal
        type={type}
        stats={globalStats}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
