import { cardDatabase } from "@/data/cardDatabase";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

export const CardsInfo = () => {
  const isMobile = useIsMobile();

  const renderCardInfo = (type: 'character' | 'pet') => {
    return cardDatabase
      .filter(card => card.type === type)
      .map((card, index) => (
        <Card key={index} className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
          <h3 className={`font-semibold text-game-accent mb-2 ${isMobile ? 'text-sm' : ''}`}>
            {card.name}
          </h3>
          <p className={`text-gray-400 mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {card.description}
          </p>
          <div className={`grid grid-cols-2 gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="text-game-secondary">Сила: {card.baseStats.power}</div>
            <div className="text-game-secondary">Защита: {card.baseStats.defense}</div>
            <div className="text-game-secondary">Здоровье: {card.baseStats.health}</div>
            <div className="text-game-secondary">Магия: {card.baseStats.magic}</div>
          </div>
        </Card>
      ));
  };

  return (
    <Tabs defaultValue="heroes" className="w-full">
      <TabsList className={`grid w-full grid-cols-2 bg-game-surface ${isMobile ? 'text-sm' : ''}`}>
        <TabsTrigger value="heroes" className="text-game-accent">
          Герои
        </TabsTrigger>
        <TabsTrigger value="pets" className="text-game-accent">
          Питомцы
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="heroes">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderCardInfo('character')}
        </div>
      </TabsContent>
      
      <TabsContent value="pets">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renderCardInfo('pet')}
        </div>
      </TabsContent>
    </Tabs>
  );
};