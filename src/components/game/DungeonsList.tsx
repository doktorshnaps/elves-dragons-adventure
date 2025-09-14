import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { dungeonNames, DungeonType } from "@/constants/dungeons";

export const DungeonsList = () => {
  const navigate = useNavigate();

  const dungeonRoutes: Record<DungeonType, string> = {
    spider_nest: '/dungeons/spider-nest',
    // Остальные подземелья временно отключены
  };

  const handleDungeonSelect = (dungeonType: DungeonType) => {
    navigate(dungeonRoutes[dungeonType]);
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {Object.entries(dungeonNames).map(([type, name]) => (
        <Button
          key={type}
          variant="outline"
          className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
          onClick={() => handleDungeonSelect(type as DungeonType)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
};