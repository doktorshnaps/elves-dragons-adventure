import { DungeonsList } from "@/components/game/DungeonsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dungeons = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <Button
        variant="outline"
        className="mb-4 bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
        onClick={() => navigate('/menu')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Вернуться в меню
      </Button>
      <DungeonsList />
    </div>
  );
};

export default Dungeons;