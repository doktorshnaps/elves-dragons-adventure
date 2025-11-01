import { Button } from "@/components/ui/button";
import { Swords, ShoppingCart, BookOpen, BarChart3, Store, Shield, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface GameButtonsProps {
  onGameModeClick: () => void;
  onShopClick: () => void;
  onStatsClick: () => void;
  onEquipmentClick: () => void;
  onTeamClick: () => void;
}

export const GameButtons = ({
  onGameModeClick,
  onShopClick,
  onStatsClick,
  onEquipmentClick,
  onTeamClick,
}: GameButtonsProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language } = useLanguage();

  return (
    <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-4 mb-2 sm:mb-6">
      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={() => navigate('/dungeons')}
      >
        <Swords className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'menu.dungeon')}</span>}
      </Button>
      
      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={onShopClick}
      >
        <ShoppingCart className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'gameHeader.openShop')}</span>}
      </Button>

      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={() => navigate('/marketplace')}
      >
        <Store className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'menu.marketplace')}</span>}
      </Button>

      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={onStatsClick}
      >
        <BarChart3 className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'gameHeader.statistics')}</span>}
      </Button>

      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={() => navigate('/grimoire')}
      >
        <BookOpen className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'menu.grimoire')}</span>}
      </Button>

      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={onEquipmentClick}
      >
        <Shield className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'equipment.title')}</span>}
      </Button>

      <Button
        variant="outline"
        className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80 flex-1 sm:flex-none h-8 sm:h-10 px-2 sm:px-4"
        onClick={onTeamClick}
      >
        <Users className="w-4 h-4" />
        {!isMobile && <span className="ml-2">{t(language, 'menu.team')}</span>}
      </Button>
    </div>
  );
};