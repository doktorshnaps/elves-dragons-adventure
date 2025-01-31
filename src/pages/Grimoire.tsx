import { CardsInfo } from "@/components/game/CardsInfo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Grimoire = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          className="bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад
        </Button>
        <h1 className="text-2xl font-bold text-game-accent">Гримуар</h1>
      </div>
      
      <div className="bg-game-surface/80 p-4 rounded-lg border border-game-accent">
        <CardsInfo />
      </div>
    </div>
  );
};