
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
        variant="outline" 
        className="fixed left-4 top-4 z-50 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={onBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t(language, 'common.backToMenu')}
      </Button>
    </div>
  );
};
