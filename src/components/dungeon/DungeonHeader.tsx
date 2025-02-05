import { useInventoryState } from "@/hooks/useInventoryState";
import { Layers, Package } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { InventoryDisplay } from "../game/InventoryDisplay";
import { DragonEggProvider } from "@/contexts/DragonEggContext";

interface DungeonHeaderProps {
  level: number;
}

export const DungeonHeader = ({ level }: DungeonHeaderProps) => {
  const { inventory } = useInventoryState();

  return (
    <div className="fixed top-20 left-0 right-0 z-50 px-4">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2 bg-game-surface/80 px-4 py-2 rounded-lg backdrop-blur-sm border border-game-accent">
          <Layers className="w-5 h-5 text-game-accent" />
          <span className="text-game-accent font-medium">Уровень подземелья: {level}</span>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="bg-game-surface/80 hover:bg-game-surface/90 text-game-accent border-game-accent"
            >
              <Package className="w-5 h-5 mr-2" />
              Инвентарь
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[540px] bg-game-surface border-game-accent">
            <div className="h-full overflow-y-auto py-8">
              <DragonEggProvider>
                <InventoryDisplay showOnlyPotions={true} />
              </DragonEggProvider>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};