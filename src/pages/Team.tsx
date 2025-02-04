import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamCards } from "@/components/game/TeamCards";

export const Team = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen p-4 flex flex-col gap-4"
      style={{
        backgroundImage: 'url("/lovable-uploads/5c84c1ed-e8af-4eb6-8495-c82bc7d6cd65.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/menu')}
          className="flex items-center gap-2 text-white hover:text-game-accent transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>Вернуться в меню</span>
        </button>
      </div>
      
      <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm">
        <TeamCards />
      </div>
    </div>
  );
};