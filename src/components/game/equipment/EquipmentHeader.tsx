import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface EquipmentHeaderProps {
  onBack: () => void;
  onMintNFT: () => void;
}

export const EquipmentHeader = ({ onBack, onMintNFT }: EquipmentHeaderProps) => {
  const { language } = useLanguage();
  return (
    <div className="flex items-center gap-4 mb-6">
      <Button 
        variant="menu"
        className="shadow-lg"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t(language, 'equipment.backToMenu')}
      </Button>
      
      <Button 
        variant="menu"
        className="shadow-lg"
        onClick={onMintNFT}
      >
        {t(language, 'equipment.mintNFT')}
      </Button>
      
      <h1 className="text-2xl font-bold text-white">{t(language, 'equipment.title')}</h1>
    </div>
  );
};
