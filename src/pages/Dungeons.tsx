import { DungeonsList } from "@/components/game/DungeonsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dungeons = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4">
      <Button
        variant="ghost"
        size="icon"
        className="mb-4 text-game-accent hover:text-game-accent/80"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <DungeonsList />
    </div>
  );
};

export default Dungeons;