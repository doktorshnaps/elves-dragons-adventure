import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface EquipmentHeaderProps {
  onBack: () => void;
  onMintNFT: () => void;
}

export const EquipmentHeader = ({ onBack, onMintNFT }: EquipmentHeaderProps) => {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button 
        variant="menu"
        className="shadow-lg"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      
      <Button 
        variant="menu"
        className="shadow-lg"
        onClick={onMintNFT}
      >
        Mint NFT
      </Button>
      
      <h1 className="text-2xl font-bold text-white">Снаряжение</h1>
    </div>
  );
};
