import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TeamCards } from "@/components/game/TeamCards";
import { Button } from "@/components/ui/button";

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
        <Button 
          variant="outline" 
          className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
          onClick={() => navigate('/menu')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться в меню
        </Button>
      </div>
      
      <div className="flex-1 bg-game-surface/90 p-4 rounded-lg border border-game-accent backdrop-blur-sm">
        <TeamCards />
      </div>
    </div>
  );
};