import { Card } from "@/components/ui/card";
import { EquipmentGrid } from "../stats/EquipmentGrid";
import { useInventoryState } from "@/hooks/useInventoryState";
import { InventoryDisplay } from "../InventoryDisplay";

export const EquipmentTab = () => {
  return (
    <div className="space-y-6">
      <Card 
        className="p-6 bg-game-surface border-game-accent relative overflow-hidden"
        style={{
          backgroundImage: `url("/lovable-uploads/29ea34c8-ede8-4cab-8ca2-049cdb5108c3.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-game-surface/90 backdrop-blur-sm" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-game-accent mb-6">Снаряжение игрока</h2>
          <EquipmentGrid />
        </div>
      </Card>

      <div className="mt-6">
        <h3 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h3>
        <InventoryDisplay readonly={false} />
      </div>
    </div>
  );
};