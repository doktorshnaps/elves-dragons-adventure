import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MultiTeamCards } from "@/components/game/team/MultiTeamCards";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { usePageMeta } from "@/hooks/usePageTitle";

export const TeamStats = () => {
  usePageMeta({ 
    title: 'Команда', 
    description: 'Собери непобедимую команду из героев и драконов. Комбинируй способности для максимального урона в подземельях.' 
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPvP = searchParams.get('from') === 'pvp';
  const { language } = useLanguage();
  return <div className="h-screen flex flex-col bg-team relative">
      <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col flex-1 overflow-y-auto p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
          <Button variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }} className="whitespace-nowrap" onClick={() => navigate(fromPvP ? '/pvp' : '/menu')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {fromPvP ? 'Назад в PvP' : t(language, 'team.backToMenu')}
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold text-white">{t(language, 'team.title')}</h1>
        </div>
        
        <DragonEggProvider>
          <div className="flex-1 pb-4">
            {/* Карты команды */}
            <Card variant="menu" className="p-2 sm:p-4" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">{t(language, 'team.management')}</h2>
              <MultiTeamCards />
            </Card>
          </div>
        </DragonEggProvider>
      </div>
    </div>;
};
