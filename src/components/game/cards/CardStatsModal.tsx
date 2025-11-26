import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { translateCardName, translateFaction } from "@/utils/cardTranslations";
import { GlobalCardStat } from "@/hooks/useGlobalCardStats";
import { Trophy, Star } from "lucide-react";

interface CardStatsModalProps {
  type: 'character' | 'pet';
  stats: GlobalCardStat[];
  isOpen: boolean;
  onClose: () => void;
}

export const CardStatsModal = ({ type, stats, isOpen, onClose }: CardStatsModalProps) => {
  const { language } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {type === 'character' 
              ? t(language, 'grimoire.heroesRating')
              : t(language, 'grimoire.petsRating')
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div 
                key={`${stat.card_name}-${stat.card_faction}`}
                className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 hover:border-primary/50 transition-colors"
              >
                {/* Место в рейтинге */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                
                {/* Информация о карте */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {translateCardName(language, stat.card_name)}
                  </div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <span>{translateFaction(language, stat.card_faction)}</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      {stat.rarity}
                    </span>
                  </div>
                </div>
                
                {/* Количество найденных */}
                <div className="flex-shrink-0 text-right">
                  <div className="text-2xl font-bold text-primary">
                    {stat.total_found}
                  </div>
                  <div className="text-xs text-white/60">
                    {t(language, 'grimoire.found')}
                  </div>
                </div>
              </div>
            ))}
            
            {stats.length === 0 && (
              <div className="text-center py-8 text-white/60">
                {t(language, 'grimoire.noDataYet')}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
