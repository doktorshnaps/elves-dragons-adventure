import { Opponent } from "@/types/battle";
import { generateBlackDragonLairOpponents } from "./BlackDragonLair";
import { generateForgottenSoulsCaveOpponents } from "./ForgottenSoulsCave";
import { generateIcyThroneOpponents } from "./IcyThroneGenerator";
import { generateDarkMageTowerOpponents } from "./DarkMageTowerGenerator";
import { generateSpiderNestOpponents } from "./SpiderNestGenerator";
import { generateBoneDemonDungeonOpponents } from "./BoneDemonDungeonGenerator";
import { generateSeaSerpentLairOpponents } from "./SeaSerpentLairGenerator";

export type DungeonGenerator = (level: number) => Opponent[];

const dungeonImages = {
  "Логово Черного Дракона": "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png",
  "Пещеры Забытых Душ": "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png",
  "Трон Ледяного Короля": "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png",
  "Лабиринт Темного Мага": "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png",
  "Гнездо Гигантских Пауков": "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
  "Темница Костяных Демонов": "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
  "Логово Морского Змея": "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
};

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
  const opponents = generator(level);
  
  // Устанавливаем правильное изображение для противников в зависимости от подземелья
  return opponents.map(opponent => ({
    ...opponent,
    image: dungeonImages[dungeonName]
  }));
};

export const getDungeonImage = (dungeonName: string): string => {
  return dungeonImages[dungeonName];
};