import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, CircleIcon, CircuitBoard, GemIcon } from "lucide-react";
import { Equipment, EquippedItems } from "@/types/equipment";
import { useEquipment } from "@/hooks/useEquipment";

export const EquipmentTab = () => {
  const { equippedItems, handleEquip, handleUnequip } = useEquipment();

  const renderEquipmentSlot = (
    slot: keyof EquippedItems,
    icon: React.ReactNode,
    label: string,
    item: Equipment | null
  ) => (
    <div className="flex items-center gap-4 p-4 border border-game-accent rounded-lg">
      <div className="p-2 bg-game-surface rounded-full">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-game-accent">{item ? item.name : 'Пусто'}</p>
        {item && (
          <div className="text-sm text-gray-400">
            {item.power && <span>Сила: +{item.power} </span>}
            {item.defense && <span>Защита: +{item.defense} </span>}
            {item.health && <span>Здоровье: +{item.health}</span>}
          </div>
        )}
      </div>
      {item && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUnequip(slot)}
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
        {renderEquipmentSlot('weapon', <Sword className="w-6 h-6 text-game-accent" />, 'Оружие', equippedItems.weapon)}
        {renderEquipmentSlot('shield', <Shield className="w-6 h-6 text-game-accent" />, 'Щит', equippedItems.shield)}
        {renderEquipmentSlot('armor', <CircuitBoard className="w-6 h-6 text-game-accent" />, 'Броня', equippedItems.armor)}
        {renderEquipmentSlot('ring1', <CircleIcon className="w-6 h-6 text-game-accent" />, 'Кольцо 1', equippedItems.ring1)}
        {renderEquipmentSlot('ring2', <CircleIcon className="w-6 h-6 text-game-accent" />, 'Кольцо 2', equippedItems.ring2)}
        {renderEquipmentSlot('necklace', <GemIcon className="w-6 h-6 text-game-accent" />, 'Ожерелье', equippedItems.necklace)}
      </div>
    </Card>
  );
};