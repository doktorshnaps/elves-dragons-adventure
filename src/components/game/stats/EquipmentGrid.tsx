import { Circle, Shield, Sword, Shirt } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface EquipmentSlot {
  name: string;
  icon: React.ReactNode;
  type: string;
}

export const EquipmentGrid = () => {
  const equipmentSlots: EquipmentSlot[] = [
    { name: "Голова", icon: <Circle className="w-5 h-5" />, type: "head" },
    { name: "Нагрудник", icon: <Shield className="w-5 h-5" />, type: "chest" },
    { name: "Наплечники", icon: <Shield className="w-5 h-5 rotate-45" />, type: "shoulders" },
    { name: "Перчатки", icon: <Circle className="w-5 h-5" />, type: "hands" },
    { name: "Ноги", icon: <Shirt className="w-5 h-5 rotate-180" />, type: "legs" },
    { name: "Ботинки", icon: <Circle className="w-5 h-5" />, type: "feet" },
    { name: "Левая рука", icon: <Shield className="w-5 h-5" />, type: "leftHand" },
    { name: "Правая рука", icon: <Sword className="w-5 h-5" />, type: "rightHand" },
    { name: "Шея", icon: <Circle className="w-5 h-5" />, type: "neck" },
    { name: "Кольцо 1", icon: <Circle className="w-5 h-5" />, type: "ring1" },
    { name: "Кольцо 2", icon: <Circle className="w-5 h-5" />, type: "ring2" },
    { name: "Бижутерия 1", icon: <Circle className="w-5 h-5" />, type: "jewelry1" },
    { name: "Бижутерия 2", icon: <Circle className="w-5 h-5" />, type: "jewelry2" },
    { name: "Пояс", icon: <Circle className="w-5 h-5" />, type: "belt" },
  ];

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-game-accent mb-4">Снаряжение</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {equipmentSlots.map((slot) => (
          <TooltipProvider key={slot.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 border border-game-accent rounded-lg bg-game-surface/50 hover:bg-game-surface/70 cursor-pointer transition-colors">
                  <div className="flex flex-col items-center gap-2">
                    {slot.icon}
                    <span className="text-xs text-game-accent">{slot.name}</span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Пусто</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};