import { Opponent } from "@/types/battle";
import { generateBlackDragonLairOpponents } from "./BlackDragonLair";
import { generateForgottenSoulsCaveOpponents } from "./ForgottenSoulsCave";

type DungeonGenerator = (level: number) => Opponent[];

const dungeonGenerators: Record<string, DungeonGenerator> = {
  "Логово Черного Дракона": generateBlackDragonLairOpponents,
  "Пещеры Забытых Душ": generateForgottenSoulsCaveOpponents,
  // Добавьте остальные подземелья по аналогии
};

export const generateDungeonOpponents = (dungeonName: string, level: number): Opponent[] => {
  const generator = dungeonGenerators[dungeonName];
  if (!generator) {
    console.warn(`Generator not found for dungeon: ${dungeonName}`);
    return generateBlackDragonLairOpponents(level); // Fallback
  }
  return generator(level);
};