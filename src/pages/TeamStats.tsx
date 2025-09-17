import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamCards } from "@/components/game/TeamCards";
import { TeamStats as TeamStatsComponent } from "@/components/game/TeamStats";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
export const TeamStats = () => {
  const navigate = useNavigate();
  return (
    <div className="h-screen flex flex-col p-2 sm:p-4 bg-cover bg-center bg-no-repeat relative" style={{
      backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="relative z-10 flex flex-col h-full min-h-0">
        <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-shrink-0">
          <Button variant="outline" className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface text-xs sm:text-sm p-2 sm:p-3" onClick={() => navigate('/menu')}>
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Меню
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold text-game-accent">Команда</h1>
        </div>
        
        <DragonEggProvider>
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="bg-game-surface/90 p-2 sm:p-3 rounded-lg border border-game-accent backdrop-blur-sm h-full flex flex-col min-h-0">
              <h2 className="text-base sm:text-lg font-bold text-game-accent mb-2 sm:mb-3 flex-shrink-0">Управление командой</h2>
              <div className="flex-1 min-h-0 overflow-hidden">
                <TeamCards />
              </div>
            </div>
          </div>
        </DragonEggProvider>
      </div>
    </div>
  );
};