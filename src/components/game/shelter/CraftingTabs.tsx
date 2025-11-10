import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ShelterCrafting } from "./ShelterCrafting";
import { ActiveCrafts } from "./ActiveCrafts";
import { CraftRecipe } from "@/hooks/shelter/useShelterState";
import { Hammer, Package, RefreshCw } from "lucide-react";

interface CraftingTabsProps {
  recipes: CraftRecipe[];
  canAffordCraft: (recipe: CraftRecipe) => boolean;
  handleCraft: (recipe: CraftRecipe) => void;
  workshopLevel: number;
  inventoryCounts: Record<string, number>;
  activeWorkers: any[];
  onRefresh?: () => void;
}

export const CraftingTabs = ({
  recipes,
  canAffordCraft,
  handleCraft,
  workshopLevel,
  inventoryCounts,
  activeWorkers,
  onRefresh
}: CraftingTabsProps) => {
  const [craftingSubTab, setCraftingSubTab] = useState<"recipes" | "active">("recipes");

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Обновить
        </Button>
      </div>
      
      <Tabs value={craftingSubTab} onValueChange={(value) => setCraftingSubTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/50 border-2 border-white backdrop-blur-sm rounded-3xl p-1 mb-6" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <TabsTrigger value="recipes" className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl">
            <Hammer className="w-4 h-4" />
            <span>Рецепты</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center justify-center gap-2 text-white data-[state=active]:bg-white/20 rounded-2xl">
            <Package className="w-4 h-4" />
            <span>Активные крафты</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="mt-0 animate-fade-in min-h-[400px]">
          <ShelterCrafting
            recipes={recipes}
            canAffordCraft={canAffordCraft}
            handleCraft={handleCraft}
            workshopLevel={workshopLevel}
            inventoryCounts={inventoryCounts}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-0 animate-fade-in min-h-[400px]">
          <ActiveCrafts activeWorkers={activeWorkers} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
