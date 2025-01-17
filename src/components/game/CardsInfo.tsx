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
    return cardDatabase
      .filter(card => card.type === type)
      .map((card, index) => (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 w-full max-w-[180px] sm:max-w-[250px]">
                {card.image && (
                  <div className="w-full h-24 sm:h-32 mb-2 rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src={card.image} 
                      alt={card.name}
                      className="w-full h-full object-contain"
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
              {renderRarityStats(card.baseStats)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ));
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
      
      <TabsContent value="heroes">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 justify-items-center">
          {renderCardInfo('character')}
        </div>
      </TabsContent>
      
      <TabsContent value="pets">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 sm:gap-2 justify-items-center">
          {renderCardInfo('pet')}
        </div>
      </TabsContent>
    </Tabs>
  );
};