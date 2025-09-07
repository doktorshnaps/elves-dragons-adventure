import { Card as CardType } from "@/types/cards";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { getRarityLabel } from "@/utils/cardUtils";
import { CardImage } from "./CardImage";
import { useState } from "react";
import { CardPreviewModal } from "./CardPreviewModal";

interface NFTCardGridProps {
  cards: CardType[];
}

export const NFTCardGrid = ({ cards }: NFTCardGridProps) => {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setShowPreview(true);
  };

  const gridCols = cards.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  cards.length <= 8 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

  return (
    <>
      <div className={`grid ${gridCols} gap-2 justify-items-center`}>
        {cards.map((card) => (
          <Card 
            key={card.id}
            className="w-full max-w-[160px] cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-game-surface border-game-accent overflow-hidden"
            onClick={() => handleCardClick(card)}
          >
            <div className="aspect-[3/4] relative">
              <CardImage image={card.image} name={card.name} />
              
              {/* NFT Badge */}
              <div className="absolute top-2 right-2 bg-purple-600/90 text-white text-xs px-2 py-1 rounded">
                NFT
              </div>
              
              {/* Rarity indicator */}
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-bold">
                  {getRarityLabel(card.rarity)}
                </span>
              </div>
            </div>
            
            <div className="p-2">
              <h3 className="text-xs font-semibold text-game-accent truncate mb-1">
                {card.name}
              </h3>
              
              <div className="flex justify-between text-xs">
                <span className="text-red-400">⚔️{card.power}</span>
                <span className="text-blue-400">🛡️{card.defense}</span>
                <span className="text-green-400">❤️{card.health}</span>
              </div>
              
              {card.faction && (
                <div className="text-xs text-purple-400 mt-1 truncate">
                  {card.faction}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <CardPreviewModal
        card={selectedCard}
        open={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
};