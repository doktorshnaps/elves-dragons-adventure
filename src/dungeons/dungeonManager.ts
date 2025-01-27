import { Opponent } from "@/types/battle";
import { generateBlackDragonLairOpponents } from "./BlackDragonLair";
import { generateForgottenSoulsCaveOpponents } from "./ForgottenSoulsCave";
import { generateIcyThroneOpponents } from "./IcyThroneGenerator";
import { generateDarkMageTowerOpponents } from "./DarkMageTowerGenerator";
import { generateSpiderNestOpponents } from "./SpiderNestGenerator";
import { generateBoneDemonDungeonOpponents } from "./BoneDemonDungeonGenerator";
import { generateSeaSerpentLairOpponents } from "./SeaSerpentLairGenerator";

type DungeonGenerator = (level: number) => Opponent[];

const dungeonGenerators: Record<string, DungeonGenerator> = {
  "Логово Черного Дракона": generateBlackDragonLairOpponents,
  "Пещеры Забытых Душ": generateForgottenSoulsCaveOpponents,
  "Трон Ледяного Короля": generateIcyThroneOpponents,
  "Лабиринт Темного Мага": generateDarkMageTowerOpponents,
  "Гнездо Гигантских Пауков": generateSpiderNestOpponents,
  "Темница Костяных Демонов": generateBoneDemonDungeonOpponents,
  "Логово Морского Змея": generateSeaSerpentLairOpponents
};

export const generateDungeonOpponents = (dungeonName: string, level: number): Opponent[] => {
  console.log("Generating opponents for dungeon:", dungeonName);
  const generator = dungeonGenerators[dungeonName];
  if (!generator) {
    console.warn(`Generator not found for dungeon: ${dungeonName}`);
    return generateBlackDragonLairOpponents(level); // Fallback
  }
  return generator(level);
};