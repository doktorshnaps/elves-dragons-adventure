import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, CircuitBoard, GemIcon, CircleIcon } from "lucide-react";
import { Equipment, EquippedItems } from "@/types/equipment";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface EquipmentTabProps {
  equipment: Equipment[];
  onEquip: (item: Equipment) => void;
  onUnequip: (slot: string) => void;
}

export const EquipmentTab = ({ equipment, onEquip, onUnequip }: EquipmentTabProps) => {
  const { toast } = useToast();
  const [equippedItems, setEquippedItems] = useState<EquippedItems>({
    weapon: null,
    shield: null,
    armor: null,
    ring1: null,
    ring2: null,
    necklace: null
  });

  const handleEquip = (item: Equipment) => {
    if (item.equipped) {
      onUnequip(item.slot);
      toast({
        title: "Предмет снят",
        description: `${item.name} снят с персонажа`
      });
    } else {
      onEquip(item);
      toast({
        title: "Предмет экипирован",
        description: `${item.name} экипирован на персонажа`
      });
    }
  };

  const renderEquipmentSlot = (slot: string, icon: React.ReactNode, item: Equipment | null) => (
    <div className="flex items-center gap-4 p-4 border border-game-accent rounded-lg">
      <div className="p-2 bg-game-surface rounded-full">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-400">{slot}</p>
        <p className="text-game-accent">{item ? item.name : 'Пусто'}</p>
      </div>
      {item && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEquip(item)}
          className="text-game-accent"
        >
          Снять
        </Button>
      )}
    </div>
  );

  return (
    <Card className="p-6 bg-game-surface border-game-accent">
      <h3 className="text-xl font-bold text-game-accent mb-4">Экипировка</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderEquipmentSlot('Оружие', <Sword className="w-6 h-6 text-game-accent" />, equippedItems.weapon)}
        {renderEquipmentSlot('Щит', <Shield className="w-6 h-6 text-game-accent" />, equippedItems.shield)}
        {renderEquipmentSlot('Броня', <CircuitBoard className="w-6 h-6 text-game-accent" />, equippedItems.armor)}
        {renderEquipmentSlot('Кольцо 1', <CircleIcon className="w-6 h-6 text-game-accent" />, equippedItems.ring1)}
        {renderEquipmentSlot('Кольцо 2', <CircleIcon className="w-6 h-6 text-game-accent" />, equippedItems.ring2)}
        {renderEquipmentSlot('Ожерелье', <GemIcon className="w-6 h-6 text-game-accent" />, equippedItems.necklace)}
      </div>

      <div className="mt-6">
        <h4 className="text-lg font-semibold text-game-accent mb-4">Доступные предметы</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equipment.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border border-game-accent rounded-lg">
              <div>
                <p className="text-game-accent">{item.name}</p>
                <div className="flex gap-2 text-sm text-gray-400">
                  {item.power && <span>Сила: +{item.power}</span>}
                  {item.defense && <span>Защита: +{item.defense}</span>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEquip(item)}
                className="text-game-accent"
              >
                {item.equipped ? 'Снять' : 'Надеть'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};