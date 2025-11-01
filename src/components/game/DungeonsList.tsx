import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DungeonType } from "@/constants/dungeons";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

const getDungeonName = (dungeon: DungeonType, lang: string) => {
  const keys: Record<DungeonType, string> = {
    spider_nest: 'dungeonSearch.spiderNest',
    bone_dungeon: 'dungeonSearch.boneDungeon',
    dark_mage: 'dungeonSearch.darkMage',
    forgotten_souls: 'dungeonSearch.forgottenSouls',
    ice_throne: 'dungeonSearch.iceThrone',
    sea_serpent: 'dungeonSearch.seaSerpent',
    dragon_lair: 'dungeonSearch.dragonLair',
    pantheon_gods: 'dungeonSearch.pantheonGods'
  };
  return t(lang as any, keys[dungeon]);
};

export const DungeonsList = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const dungeonRoutes: Record<DungeonType, string> = {
    spider_nest: '/dungeons/spider-nest',
    bone_dungeon: '/dungeons/bone-dungeon',
    dark_mage: '/dungeons/dark-mage',
    forgotten_souls: '/dungeons/forgotten-souls',
    ice_throne: '/dungeons/ice-throne',
    sea_serpent: '/dungeons/sea-serpent',
    dragon_lair: '/dungeons/dragon-lair',
    pantheon_gods: '/dungeons/pantheon-gods'
  };

  const handleDungeonSelect = (dungeonType: DungeonType) => {
    navigate(dungeonRoutes[dungeonType]);
  };

  const dungeonTypes: DungeonType[] = [
    'spider_nest',
    'bone_dungeon',
    'dark_mage',
    'forgotten_souls',
    'ice_throne',
    'sea_serpent',
    'dragon_lair',
    'pantheon_gods'
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {dungeonTypes.map((type) => (
        <Button
          key={type}
          variant="outline"
          className="h-16 sm:h-24 bg-game-surface border-game-accent text-game-accent hover:bg-game-surface/80"
          onClick={() => handleDungeonSelect(type)}
        >
          {getDungeonName(type, language)}
        </Button>
      ))}
    </div>
  );
};