import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { translateItemName, translateItemType } from "@/utils/itemTranslations";
import { GlobalItemStat } from "@/hooks/useGlobalItemStats";
import { Trophy, Package } from "lucide-react";

interface ItemStatsModalProps {
  stats: GlobalItemStat[];
  isOpen: boolean;
  onClose: () => void;
}

export const ItemStatsModal = ({ stats, isOpen, onClose }: ItemStatsModalProps) => {
  const { language } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {t(language, 'grimoire.itemsRating')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1">
          <div className="space-y-2">
            {stats.map((stat, index) => (
              <div 
                key={stat.template_id}
                className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 hover:border-primary/50 transition-colors"
              >
                {/* Место в рейтинге */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </div>
                
                {/* Информация о предмете */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">
                    {translateItemName(language, stat.item_name)}
                  </div>
                  <div className="text-xs text-white/60 flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    <span>{translateItemType(language, stat.item_type)}</span>
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
