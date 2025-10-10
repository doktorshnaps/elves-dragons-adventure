
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface GameHeaderProps {
  balance: number;
  onBack: () => void;
}

export const GameHeader = ({ balance, onBack }: GameHeaderProps) => {
  const { language } = useLanguage();
  
  return (
    <div className="flex items-center h-full">
      <Button 
        variant="menu"
        className="fixed left-4 top-4 z-50"
        style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t(language, 'common.backToMenu')}
      </Button>
    </div>
  );
};
