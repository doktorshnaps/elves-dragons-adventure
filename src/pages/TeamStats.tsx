import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamCards } from "@/components/game/TeamCards";
import { TeamStats as TeamStatsComponent } from "@/components/game/TeamStats";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

export const TeamStats = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  return <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" style={{
    backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 flex flex-col min-h-screen p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
          <Button variant="menu" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }} className="whitespace-nowrap" onClick={() => navigate('/menu')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t(language, 'team.backToMenu')}
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold text-white">{t(language, 'team.title')}</h1>
        </div>
        
        <DragonEggProvider>
          <div className="flex-1 pb-4">
            {/* Карты команды */}
            <Card variant="menu" className="p-2 sm:p-4" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-4">{t(language, 'team.management')}</h2>
              <TeamCards />
            </Card>
          </div>
        </DragonEggProvider>
      </div>
    </div>;
};