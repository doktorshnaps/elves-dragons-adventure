import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { dungeonNames, DungeonType } from "@/constants/dungeons";

export const DungeonsList = () => {
  const navigate = useNavigate();

  const dungeonRoutes: Record<DungeonType, string> = {
    dragon_lair: '/dungeons/dragon-lair',
    forgotten_souls: '/dungeons/forgotten-souls',
    ice_throne: '/dungeons/icy-throne',
    dark_mage: '/dungeons/dark-mage',
    spider_nest: '/dungeons/spider-nest',
    bone_dungeon: '/dungeons/bone-dungeon',
    sea_serpent: '/dungeons/sea-serpent'
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