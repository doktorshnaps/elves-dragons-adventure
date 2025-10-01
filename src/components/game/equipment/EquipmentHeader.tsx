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
        variant="outline" 
        className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface" 
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      
      <Button 
        variant="outline" 
        className="bg-game-accent/20 border-game-accent text-game-accent hover:bg-game-accent/30" 
        onClick={onMintNFT}
      >
        Mint NFT
      </Button>
      
      <h1 className="text-2xl font-bold text-game-accent">Снаряжение</h1>
    </div>
  );
};
