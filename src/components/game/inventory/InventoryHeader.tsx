import { Coins } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import mgtTokenImg from "@/assets/items/mgt-token.webp";

interface InventoryHeaderProps {
  balance: number;
  mgtBalance?: number;
}

export const InventoryHeader = ({ balance, mgtBalance = 0 }: InventoryHeaderProps) => {
  const { language } = useLanguage();
  
  return (
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white drop-shadow-lg">{t(language, 'inventory.title')}</h3>
        <div className="flex items-center gap-3">
          {/* ELL Balance */}
          <div className="flex items-center gap-2 bg-black/50 border-2 border-white backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-medium">{balance.toLocaleString()}</span>
          </div>
          {/* mGT Balance */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-2 border-purple-400/50 backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-lg">
            <img src={mgtTokenImg} alt="mGT" className="w-4 h-4 rounded-full" />
            <span className="text-purple-200 font-medium">{mgtBalance.toLocaleString()}</span>
            <span className="text-purple-400 text-xs">mGT</span>
          </div>
        </div>
      </div>
  );
};