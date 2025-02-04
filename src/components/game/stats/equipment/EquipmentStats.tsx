import { ShopItem } from "@/components/shop/types";

interface EquipmentStatsProps {
  totalStats: {
    power: number;
    defense: number;
    health: number;
  };
}

export const EquipmentStats = ({ totalStats }: EquipmentStatsProps) => {
  return (
    <div className="space-y-4 max-w-[650px] mx-auto">
      <h3 className="text-lg font-semibold text-game-accent">Бонусы экипировки</h3>
      <div className="flex justify-between text-base text-game-accent mb-4">
        <div className="grid grid-cols-3 gap-x-4">
          <p>Сила: +{totalStats.power}</p>
          <p>Защита: +{totalStats.defense}</p>
          <p>Жизнь: +{totalStats.health}</p>
        </div>
      </div>
    </div>
  );
};