import { Coins } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface InventoryHeaderProps {
  balance: number;
}

export const InventoryHeader = ({ balance }: InventoryHeaderProps) => {
  const { language } = useLanguage();
  
  return (
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white drop-shadow-lg">{t(language, 'inventory.title')}</h3>
        <div className="flex items-center gap-2 bg-black/50 border-2 border-white backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-lg">
          <Coins className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-medium">{balance}</span>
        </div>
      </div>
  );
};