import { Coins } from "lucide-react";

interface InventoryHeaderProps {
  balance: number;
}

export const InventoryHeader = ({ balance }: InventoryHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-xl font-bold text-white drop-shadow-lg">Инвентарь</h3>
      <div className="flex items-center gap-2 bg-game-surface/80 px-3 py-1.5 rounded-lg backdrop-blur-sm">
        <Coins className="w-4 h-4 text-yellow-400" />
        <span className="text-white font-medium">{balance}</span>
      </div>
    </div>
  );
};