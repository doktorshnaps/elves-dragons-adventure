import { Circle, Shield, Sword, Shirt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { useInventoryState } from "@/hooks/useInventoryState";
import { Item } from "@/types/inventory";
import { Button } from "@/components/ui/button";
import { canEquipItem, getEquipmentSlot } from "@/utils/itemUtils";
import { useToast } from "@/hooks/use-toast";
import { PlayerStats } from "@/types/battle";
import { usePlayerState } from "@/hooks/usePlayerState";
import { CombatStats } from "./CombatStats";
import { HealthBar } from "./HealthBar";

type EquipmentSlotType = NonNullable<Item['slot']>;

interface EquipmentSlot {
  name: string;
  icon: React.ReactNode;
  type: EquipmentSlotType;
}

export const EquipmentGrid = () => {
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlotType | null>(null);
  const { inventory, updateInventory } = useInventoryState();
  const { toast } = useToast();
  const { playerStats } = usePlayerState();

  const equipmentSlots: EquipmentSlot[] = [
    { name: "Голова", icon: <Circle className="w-5 h-5" />, type: "head" },
    { name: "Нагрудник", icon: <Shield className="w-5 h-5" />, type: "chest" },
    { name: "Руки", icon: <Circle className="w-5 h-5" />, type: "hands" },
    { name: "Ноги", icon: <Shirt className="w-5 h-5 rotate-180" />, type: "legs" },
    { name: "Ботинки", icon: <Circle className="w-5 h-5" />, type: "feet" },
    { name: "Оружие", icon: <Sword className="w-5 h-5" />, type: "weapon" },
    { name: "Шея", icon: <Circle className="w-5 h-5" />, type: "neck" },
    { name: "Кольцо 1", icon: <Circle className="w-5 h-5" />, type: "ring1" },
    { name: "Кольцо 2", icon: <Circle className="w-5 h-5" />, type: "ring2" },
    { name: "Левая рука", icon: <Shield className="w-5 h-5" />, type: "offhand" },
  ];

  const getEquippedItem = (slotType: EquipmentSlotType) => {
    return inventory.find(item => item.equipped && item.slot === slotType);
  };

  const getAvailableItems = (slotType: EquipmentSlotType) => {
    return inventory.filter(item => 
      canEquipItem(item) && 
      !item.equipped && 
      getEquipmentSlot(item) === slotType
    );
  };

  const handleEquipItem = (item: Item) => {
    if (!selectedSlot) return;

    const updatedInventory = inventory.map(invItem => {
      if (invItem.equipped && invItem.slot === selectedSlot) {
        return { ...invItem, equipped: false, slot: undefined };
      }
      return invItem;
    });

    const finalInventory = updatedInventory.map(invItem => {
      if (invItem.id === item.id) {
        return { ...invItem, equipped: true, slot: selectedSlot };
      }
      return invItem;
    }) as Item[];

    updateInventory(finalInventory);
    setSelectedSlot(null);

    toast({
      title: "Предмет экипирован",
      description: `${item.name} успешно экипирован`,
    });
  };

  const handleUnequipItem = (item: Item) => {
    const updatedInventory = inventory.map(invItem => {
      if (invItem.id === item.id) {
        return { ...invItem, equipped: false, slot: undefined };
      }
      return invItem;
    }) as Item[];

    updateInventory(updatedInventory);
    
    toast({
      title: "Предмет снят",
      description: `${item.name} успешно снят`,
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {equipmentSlots.map((slot) => {
          const equippedItem = getEquippedItem(slot.type);

          return (
            <TooltipProvider key={slot.type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div 
                    className={`p-3 border rounded-lg cursor-pointer transition-colors
                      ${equippedItem 
                        ? 'border-game-accent bg-game-surface/70 hover:bg-game-surface/90' 
                        : 'border-game-accent/50 bg-game-surface/50 hover:bg-game-surface/70'
                      }`}
                    onClick={() => setSelectedSlot(slot.type)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {slot.icon}
                      <span className="text-xs text-game-accent">{slot.name}</span>
                      {equippedItem && (
                        <div className="text-[10px] text-game-accent mt-1">
                          {equippedItem.name}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {equippedItem ? (
                    <div className="text-sm">
                      <p>{equippedItem.name}</p>
                      {equippedItem.stats && (
                        <div className="mt-1 text-xs">
                          {equippedItem.stats.power && <p>Сила: +{equippedItem.stats.power}</p>}
                          {equippedItem.stats.defense && <p>Защита: +{equippedItem.stats.defense}</p>}
                          {equippedItem.stats.health && <p>Здоровье: +{equippedItem.stats.health}</p>}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>Пусто</p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <Dialog open={selectedSlot !== null} onOpenChange={() => setSelectedSlot(null)}>
        <DialogContent className="bg-game-surface border-game-accent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-game-accent">
              Выберите предмет для слота {equipmentSlots.find(slot => slot.type === selectedSlot)?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Характеристики игрока */}
            <div className="p-4 border border-game-accent rounded-lg bg-game-surface/50">
              <h3 className="text-lg font-semibold text-game-accent mb-4">Характеристики персонажа</h3>
              <div className="space-y-4">
                <HealthBar health={playerStats.health} maxHealth={playerStats.maxHealth} />
                <CombatStats power={playerStats.power} defense={playerStats.defense} />
              </div>
            </div>

            {/* Список предметов */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedSlot && getEquippedItem(selectedSlot) && (
                <Button
                  variant="destructive"
                  onClick={() => handleUnequipItem(getEquippedItem(selectedSlot)!)}
                  className="col-span-full"
                >
                  Снять текущий предмет
                </Button>
              )}
              
              {selectedSlot && getAvailableItems(selectedSlot).map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-game-accent rounded-lg bg-game-surface/50 hover:bg-game-surface/70 cursor-pointer"
                  onClick={() => handleEquipItem(item)}
                >
                  <div className="flex flex-col gap-2">
                    <h3 className="font-bold text-game-accent">{item.name}</h3>
                    <p className="text-sm text-gray-400">{item.description}</p>
                    {item.stats && (
                      <div className="text-sm text-game-accent">
                        {item.stats.power && <p>Сила: +{item.stats.power}</p>}
                        {item.stats.defense && <p>Защита: +{item.stats.defense}</p>}
                        {item.stats.health && <p>Здоровье: +{item.stats.health}</p>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {selectedSlot && getAvailableItems(selectedSlot).length === 0 && (
                <p className="text-center col-span-full text-gray-400">
                  Нет доступных предметов для этого слота
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};