import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EquipmentGrid } from "@/components/game/stats/EquipmentGrid";
import { InventoryDisplay } from "@/components/game/InventoryDisplay";
import { DragonEggProvider } from "@/contexts/DragonEggContext";

export const Equipment = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backgroundBlendMode: 'multiply'
      }}
    >
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
        <h1 className="text-2xl font-bold text-game-accent">Снаряжение</h1>
      </div>
      
      <DragonEggProvider>
        <div className="space-y-6">
          <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm">
            <EquipmentGrid />
          </div>

          <div className="flex-1">
            <InventoryDisplay onUseItem={undefined} readonly={false} />
          </div>
        </div>
      </DragonEggProvider>
    </div>
  );
};