import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { TeamCards } from "./TeamCards";
import { DungeonsList } from "./DungeonsList";
import { InventoryDisplay } from "./InventoryDisplay";
import { Item } from "../battle/Inventory";
import { useToast } from "@/hooks/use-toast";

export const GameTabs = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [inventory, setInventory] = useState<Item[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const handleUseItem = (item: Item) => {
    const savedState = localStorage.getItem('battleState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (item.type === 'healthPotion') {
        const newHealth = Math.min(
          state.playerStats.health + item.value,
          state.playerStats.maxHealth
        );
        state.playerStats.health = newHealth;
        localStorage.setItem('battleState', JSON.stringify(state));
        
        const newInventory = inventory.filter(i => i.id !== item.id);
        setInventory(newInventory);
        localStorage.setItem('gameInventory', JSON.stringify(newInventory));
        
        toast({
          title: "Зелье использовано",
          description: `Восстановлено ${item.value} здоровья`,
        });
      }
    }
  };

  return (
    <Tabs defaultValue="character" className="mt-4 md:mt-8">
      <TabsList className={`grid w-full grid-cols-2 bg-game-surface ${isMobile ? 'text-sm' : ''}`}>
        <TabsTrigger value="character" className="text-game-accent">
          {isMobile ? 'Команда' : 'Ваша команда'}
        </TabsTrigger>
        <TabsTrigger value="dungeons" className="text-game-accent">Подземелья</TabsTrigger>
      </TabsList>
      
      <TabsContent value="character">
        <div className={`space-y-4 ${isMobile ? 'space-y-2' : 'space-y-6'}`}>
          <TeamCards />
          <InventoryDisplay 
            inventory={inventory} 
            onUseItem={handleUseItem}
            readonly={false}
          />
        </div>
      </TabsContent>
      
      <TabsContent value="dungeons">
        <DungeonsList />
      </TabsContent>
    </Tabs>
  );
};