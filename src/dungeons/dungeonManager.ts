import { Opponent } from "@/types/battle";
import { generateSpiderNestOpponents } from "./SpiderNestGenerator";
import { generateBoneDemonOpponents } from "./BoneDemonDungeonGenerator";
import { generateSeaSerpentOpponents } from "./SeaSerpentLairGenerator";
import { generateBlackDragonLairOpponents } from "./BlackDragonLair";

export const generateDungeonOpponents = (dungeonType: string, level: number): Opponent[] => {
  const generators: { [key: string]: (level: number) => Opponent[] } = {
    "spider_nest": generateSpiderNestOpponents,
    "bone_demon": generateBoneDemonOpponents,
    "sea_serpent": generateSeaSerpentOpponents,
    "black_dragon": generateBlackDragonLairOpponents
  };

  const generator = generators[dungeonType];
  if (!generator) {
    console.error(`Unknown dungeon type: ${dungeonType}`);
    return [];
  }

  return generator(level);
};

export const getDungeonName = (dungeonType: string): string => {
  const names: { [key: string]: string } = {
    "spider_nest": "Гнездо гигантских пауков",
    "bone_demon": "Темница костяных демонов",
    "sea_serpent": "Логово морского змея",
    "black_dragon": "Логово черного дракона"
  };

  return names[dungeonType] || "Неизвестное подземелье";
};