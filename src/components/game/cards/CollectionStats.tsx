import { Card } from "@/components/ui/card";
import { useCardInstancesContext } from "@/providers/CardInstancesProvider";
import { cardDatabase } from "@/data/cardDatabase";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { BookOpen, Users, PawPrint } from "lucide-react";

interface CollectionStatsProps {
  type: 'character' | 'pet';
}

export const CollectionStats = ({ type }: CollectionStatsProps) => {
  const { language } = useLanguage();
  const { cardInstances } = useCardInstancesContext();

  // Получаем все уникальные карты из базы данных по типу
  const allCards = cardDatabase.filter(card => card.type === type);
  const totalCards = allCards.length;

  // Получаем уникальные имена карт, которые есть у игрока
  const playerCards = cardInstances.filter(instance => {
    const cardData = instance.card_data as any;
    return cardData?.type === type;
  });

  // Создаем Set уникальных имен карт
  const uniqueCardNames = new Set(
    playerCards.map(instance => {
      const cardData = instance.card_data as any;
      return cardData?.name || '';
    }).filter(name => name !== '')
  );

  const foundCards = uniqueCardNames.size;
  const percentage = totalCards > 0 ? Math.round((foundCards / totalCards) * 100) : 0;

  return (
    <Card variant="menu" className="p-4 mb-4">
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
                ? t(language, 'grimoire.heroesCollection')
                : t(language, 'grimoire.petsCollection')
              }
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {foundCards}
            </span>
            <span className="text-lg text-white/60">
              / {totalCards}
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
