import { cardDatabase } from "@/data/cardDatabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getStatsForRarity } from "@/utils/cardUtils";
import { Rarity } from "@/types/cards";
import { Sparkles } from "lucide-react";

export const CardsInfo = () => {
  const isMobile = useIsMobile();

  const renderRarityStats = (baseStats: any) => {
    const rarityLevels: Rarity[] = [1, 2, 3, 4, 5, 6, 7, 8];
    return (
      <div className="space-y-2">
        {rarityLevels.map((rarity) => {
          const stats = getStatsForRarity(rarity);
          return (
            <div key={rarity} className="text-xs">
              <div className="font-semibold text-yellow-500 mb-1">
                {"⭐".repeat(rarity)}
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-gray-300">
                <div>Сила: {stats.power}</div>
                <div>Защита: {stats.defense}</div>
                <div>Здоровье: {stats.health}</div>
                <div>Магия: {stats.magic}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCardInfo = (type: 'character' | 'pet') => {
    const cards = cardDatabase.filter(card => card.type === type);
    return (
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1 xs:gap-2">
        {cards.map((card, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-1 xs:p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 h-full">
                  {card.image && (
                    <div className="w-full aspect-[3/4] mb-1 rounded-lg overflow-hidden">
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold text-game-accent text-[10px] xs:text-xs line-clamp-1">
                    {card.name}
                  </h3>
                  <p className="text-gray-400 text-[8px] xs:text-[10px] line-clamp-2">
                    {card.description}
                  </p>
                  {card.faction && (
                    <div className="flex items-center gap-1 text-[8px] xs:text-[10px] text-purple-400">
                      <Sparkles className="w-2 h-2 xs:w-3 xs:h-3" />
                      <span className="line-clamp-1">Фракция: {card.faction}</span>
                    </div>
                  )}
                </Card>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="w-48 p-2 bg-game-surface border-game-accent"
              >
                {renderRarityStats(card.baseStats)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  return (
    <Tabs defaultValue="heroes" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-game-surface text-[10px] sm:text-xs">
        <TabsTrigger value="heroes" className="text-game-accent">
          Герои
        </TabsTrigger>
        <TabsTrigger value="pets" className="text-game-accent">
          Питомцы
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="heroes" className="mt-2">
        {renderCardInfo('character')}
      </TabsContent>
      
      <TabsContent value="pets" className="mt-2">
        {renderCardInfo('pet')}
      </TabsContent>
    </Tabs>
  );
};