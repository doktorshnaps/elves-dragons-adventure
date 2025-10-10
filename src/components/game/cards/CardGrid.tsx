import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { cardDatabase } from "@/data/cardDatabase";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { translateCardName, translateFaction, translateCardDescription } from "@/utils/cardTranslations";
import { CardRarityModal } from "./CardRarityModal";
import { CardInfo } from "@/data/cards/types";
import { calculateCardStats } from "@/utils/cardUtils";
import { useState } from "react";

interface CardGridProps {
  type: 'character' | 'pet';
}

export const CardGrid = ({ type }: CardGridProps) => {
  const { language } = useLanguage();
  const [selectedCard, setSelectedCard] = useState<CardInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const cards = cardDatabase.filter(card => card.type === type);
  const gridCols = cards.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  cards.length <= 8 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

  const handleCardClick = (card: CardInfo) => {
    setSelectedCard(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCard(null);
  };

  return (
    <>
      <div className={`grid ${gridCols} gap-2 justify-items-center`}>
        {cards.map((card, index) => (
          <Card 
            key={index}
            variant="menu"
            className="p-2 transition-all duration-300 h-full cursor-pointer hover:scale-105"
            style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}
            onClick={() => handleCardClick(card)}
          >
            {card.image && (
              <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={card.image} 
                  alt={translateCardName(language, card.name)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="font-semibold text-white mb-1 text-[10px] sm:text-xs">
              {translateCardName(language, card.name)}
            </h3>
            <p className="text-gray-300 mb-2 text-[10px] sm:text-xs line-clamp-2">
              {translateCardDescription(language, card.description)}
            </p>
            {card.faction && (
              <div className="flex items-center gap-1 mb-2 text-[10px] sm:text-xs text-purple-300">
                <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                <span>{t(language, 'items.faction')}: {translateFaction(language, card.faction)}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
              {(() => {
                const stats = calculateCardStats(card.name, 1, card.type);
                return (
                  <>
                    <div className="text-white/80">{t(language, 'items.power')}: {stats.power}</div>
                    <div className="text-white/80">{t(language, 'items.defense')}: {stats.defense}</div>
                    <div className="text-white/80">{t(language, 'items.health')}: {stats.health}</div>
                    <div className="text-white/80">{t(language, 'items.health')} (MP): {stats.magic}</div>
                  </>
                );
              })()}
            </div>
          </Card>
        ))}
      </div>

      <CardRarityModal
        cardInfo={selectedCard}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
};