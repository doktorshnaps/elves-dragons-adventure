import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RarityStats } from "./RarityStats";
import { cardDatabase } from "@/data/cardDatabase";

interface CardGridProps {
  type: 'character' | 'pet';
}

export const CardGrid = ({ type }: CardGridProps) => {
  const cards = cardDatabase.filter(card => card.type === type);
  const gridCols = cards.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' :
                  cards.length <= 8 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                  'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5';

  return (
    <div className={`grid ${gridCols} gap-2 justify-items-center`}>
      {cards.map((card, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full">
                {card.image && (
                  <div className="w-full aspect-[3/4] mb-2 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={card.image} 
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-semibold text-game-accent mb-1 text-[10px] sm:text-xs">
                  {card.name}
                </h3>
                <p className="text-gray-400 mb-2 text-[10px] sm:text-xs line-clamp-2">
                  {card.description}
                </p>
                {card.faction && (
                  <div className="flex items-center gap-1 mb-2 text-[10px] sm:text-xs text-purple-400">
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3" />
                    <span>Фракция: {card.faction}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 text-[10px] sm:text-xs">
                  <div className="text-game-secondary">Сила: {card.baseStats.power}</div>
                  <div className="text-game-secondary">Защита: {card.baseStats.defense}</div>
                  <div className="text-game-secondary">Здоровье: {card.baseStats.health}</div>
                  <div className="text-game-secondary">Магия: {card.baseStats.magic}</div>
                </div>
              </Card>
            </TooltipTrigger>
            <TooltipContent 
              side="right" 
              className="w-48 p-2 bg-game-surface border-game-accent"
            >
              <RarityStats baseStats={card.baseStats} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};