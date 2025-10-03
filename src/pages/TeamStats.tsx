import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamCards } from "@/components/game/TeamCards";
import { TeamStats as TeamStatsComponent } from "@/components/game/TeamStats";
import { DragonEggProvider } from "@/contexts/DragonEggContext";
export const TeamStats = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" style={{
    backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }}>
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 flex flex-col min-h-screen p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6 flex-shrink-0">
          <Button variant="outline" className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface whitespace-nowrap" onClick={() => navigate('/menu')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться в меню
          </Button>
          <h1 className="text-lg sm:text-2xl font-bold text-game-accent">Команда и статистика</h1>
        </div>
        
        <DragonEggProvider>
          <div className="flex-1 pb-4">
            {/* Карты команды */}
            <div className="bg-game-surface/90 p-2 sm:p-4 rounded-lg border border-game-accent backdrop-blur-sm">
              <h2 className="text-lg sm:text-xl font-bold text-game-accent mb-2 sm:mb-4">Управление командой</h2>
              <TeamCards />
            </div>
          </div>
        </DragonEggProvider>
      </div>
    </div>;
};