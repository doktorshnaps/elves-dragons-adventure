import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CardInfo } from "@/data/cards/types";
import { Rarity } from "@/types/cards";
import { calculateCardStats } from "@/utils/cardUtils";
import { resolveCardImage } from "@/utils/cardImageResolver";
import { Card } from "@/types/cards";
import { useLanguage } from "@/hooks/useLanguage";
import { translateCardName, translateFaction } from "@/utils/cardTranslations";
import { Sparkles } from "lucide-react";
interface CardRarityModalProps {
  cardInfo: CardInfo | null;
  open: boolean;
  onClose: () => void;
}
export const CardRarityModal = ({
  cardInfo,
  open,
  onClose
}: CardRarityModalProps) => {
  const {
    language
  } = useLanguage();
  if (!cardInfo) return null;
  const rarityLevels: Rarity[] = [1, 2, 3, 4, 5, 6, 7, 8];
  return <Dialog open={open} onOpenChange={v => {
    if (!v) onClose();
  }}>
      <DialogContent className="z-[60] max-w-6xl max-h-[90vh] overflow-y-auto bg-black/90 border-2 border-white backdrop-blur-sm" aria-describedby="card-rarities" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <DialogHeader>
          <DialogTitle className="text-white text-center">
            {translateCardName(language, cardInfo.name)} - Все редкости
          </DialogTitle>
        </DialogHeader>
        
        <div id="card-rarities" className="space-y-4">
          {/* Базовая информация о карте */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <Sparkles className="w-4 h-4" />
              <span>{translateFaction(language, cardInfo.faction)}</span>
            </div>
            <p className="text-white/80 text-sm">{cardInfo.description}</p>
          </div>

          {/* Сетка с редкостями */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rarityLevels.map(rarity => {
            // Используем новую систему расчета характеристик с учетом типа карты
            const stats = calculateCardStats(cardInfo.name, rarity, cardInfo.type);

            // Создаем временную карту для получения изображения по редкости
            const tempCard: Card = {
              id: `temp-${cardInfo.name}-${rarity}`,
              name: cardInfo.name,
              type: cardInfo.type,
              faction: cardInfo.faction as any,
              rarity,
              image: cardInfo.image,
              power: stats.power,
              defense: stats.defense,
              health: stats.health,
              magic: stats.magic
            };
            const cardImage = resolveCardImage(tempCard);
            return <div key={rarity} className="bg-black/50 border-2 border-white rounded-3xl p-3 mx-0 my-0 backdrop-blur-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
                  {/* Звёзды редкости */}
                  <div className="text-center mb-2">
                    
                  </div>

                  {/* Изображение карты */}
                  <div className="w-full aspect-[3/4] mb-3 rounded-lg overflow-hidden">
                    <img src={cardImage || "/placeholder.svg"} alt={`${translateCardName(language, cardInfo.name)} ${rarity} редкость`} className="w-full h-full object-cover" />
                  </div>

                  {/* Характеристики */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/30 border-2 border-white/30 rounded-3xl p-2 text-center">
                        <div className="text-white">Сила</div>
                        <div className="text-red-400 font-bold">{stats.power}</div>
                      </div>
                      <div className="bg-black/30 border-2 border-white/30 rounded-3xl p-2 text-center">
                        <div className="text-white">Защита</div>
                        <div className="text-blue-400 font-bold">{stats.defense}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/30 border-2 border-white/30 rounded-3xl p-2 text-center">
                        <div className="text-white">Здоровье</div>
                        <div className="text-green-400 font-bold">{stats.health}</div>
                      </div>
                      <div className="bg-black/30 border-2 border-white/30 rounded-3xl p-2 text-center">
                        <div className="text-white">Магия</div>
                        <div className="text-purple-300 font-bold">{stats.magic}</div>
                      </div>
                    </div>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};