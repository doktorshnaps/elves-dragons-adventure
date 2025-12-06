import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamCards } from "./TeamCards";
import { DungeonsList } from "./DungeonsList";
import { InventoryDisplay } from "./InventoryDisplay";
import { CardsInfo } from "./CardsInfo";
import { AdventuresTab } from "./adventures/AdventuresTab";
import { EquipmentTab } from "./equipment/EquipmentTab";
import { useToast } from "@/hooks/use-toast";

export const GameTabs = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const handleUseItem = () => {
    toast({
      title: "Недоступно",
      description: "Предметы можно использовать только в подземелье",
      variant: "destructive"
    });
  };

  return (
    <Tabs defaultValue="character" className="mt-4 md:mt-8">
      <TabsList className={`grid w-full ${isMobile ? 'grid-cols-5 text-[10px]' : 'grid-cols-5'} bg-game-surface`}>
        <TabsTrigger value="character" className="text-game-accent">
          {isMobile ? 'Команда' : 'Ваша команда'}
        </TabsTrigger>
        <TabsTrigger value="equipment" className="text-game-accent">
          {isMobile ? 'Снаряжение' : 'Снаряжение'}
        </TabsTrigger>
        <TabsTrigger value="dungeons" className="text-game-accent">
          Подземелья
        </TabsTrigger>
        <TabsTrigger value="adventures" className="text-game-accent">
          {isMobile ? 'Приключения' : 'Приключения'}
        </TabsTrigger>
        <TabsTrigger value="info" className="text-game-accent">
          Информация
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="character">
        <div className={`space-y-4 ${isMobile ? 'space-y-2' : 'space-y-6'}`}>
          <TeamCards />
          <InventoryDisplay 
            onUseItem={handleUseItem}
            readonly={false}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="equipment">
        <EquipmentTab />
      </TabsContent>
      
      <TabsContent value="dungeons">
        <DungeonsList />
      </TabsContent>

      <TabsContent value="adventures">
        <AdventuresTab />
      </TabsContent>

      <TabsContent value="info">
        <CardsInfo />
      </TabsContent>
    </Tabs>
  );
};