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
      <div className="space-y-1 text-xs">
        {rarityLevels.map((rarity) => {
          const stats = getStatsForRarity(rarity);
          return (
            <div key={rarity}>
              <div className="font-semibold text-yellow-500 mb-0.5">
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
              <Card className="p-2 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 w-full">
                <div className="flex flex-col space-y-1">
                  {card.image && (
                    <div className="w-full aspect-square mb-1 rounded-lg overflow-hidden h-24">
                      <img 
                        src={card.image} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h3 className={`font-semibold text-game-accent ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {card.name}
                  </h3>
                  <p className={`text-gray-400 line-clamp-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                    {card.description}
                  </p>
                  {card.faction && (
                    <div className={`flex items-center gap-0.5 ${isMobile ? 'text-[10px]' : 'text-xs'} text-purple-400`}>
                      <Sparkles className="w-3 h-3" />
                      <span>Фракция: {card.faction}</span>
                    </div>
                  )}
                  <div className={`grid grid-cols-2 gap-1 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                    <div className="text-game-secondary">Сила: {card.baseStats.power}</div>
                    <div className="text-game-secondary">Защита: {card.baseStats.defense}</div>
                    <div className="text-game-secondary">Здоровье: {card.baseStats.health}</div>
                    <div className="text-game-secondary">Магия: {card.baseStats.magic}</div>
                  </div>
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
      <TabsList className={`grid w-full grid-cols-2 bg-game-surface ${isMobile ? 'text-xs' : 'text-sm'}`}>
        <TabsTrigger value="heroes" className="text-game-accent">
          Герои
        </TabsTrigger>
        <TabsTrigger value="pets" className="text-game-accent">
          Питомцы
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="heroes">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {renderCardInfo('character')}
        </div>
      </TabsContent>
      
      <TabsContent value="pets">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {renderCardInfo('pet')}
        </div>
      </TabsContent>
    </Tabs>
  );
};