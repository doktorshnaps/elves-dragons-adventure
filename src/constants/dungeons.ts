export const dungeonBackgrounds = {
  "spider_nest": "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
  "dragon_lair": "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png",
  "forgotten_souls": "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png",
  "ice_throne": "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png",
  "dark_mage": "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png",
  "bone_dungeon": "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
  "sea_serpent": "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png",
  "pantheon_gods": "/lovable-uploads/pantheon-of-gods.png"
} as const;

export const dungeons = [
  "spider_nest",
  "dragon_lair",
  "forgotten_souls", 
  "ice_throne",
  "dark_mage",
  "bone_dungeon",
  "sea_serpent",
  "pantheon_gods"
] as const;

export const dungeonNames = {
  spider_nest: "Гнездо Гигантских Пауков",
  dragon_lair: "Логово Черного Дракона",
  forgotten_souls: "Пещеры Забытых Душ",
  ice_throne: "Трон Ледяного Короля",
  dark_mage: "Лабиринт Темного Мага",
  bone_dungeon: "Темница Костяных Демонов",
  sea_serpent: "Логово Морского Змея",
  pantheon_gods: "Пантеон Богов"
} as const;

export const dungeonRoutes = {
  spider_nest: "/dungeons/spider-nest",
  dragon_lair: "/dungeons/dragon-lair",
  forgotten_souls: "/dungeons/forgotten-souls",
  ice_throne: "/dungeons/ice-throne",
  dark_mage: "/dungeons/dark-mage",
  bone_dungeon: "/dungeons/bone-dungeon",
  sea_serpent: "/dungeons/sea-serpent",
  pantheon_gods: "/dungeons/pantheon-gods"
} as const;

export type DungeonType = keyof typeof dungeonNames;

// Диапазоны уровней для прокачки в каждом подземелье
export const dungeonLevelRanges = {
  spider_nest: { min: 1, max: 15 },
  bone_dungeon: { min: 15, max: 30 },
  dark_mage: { min: 30, max: 40 },
  forgotten_souls: { min: 40, max: 50 },
  ice_throne: { min: 50, max: 65 },
  sea_serpent: { min: 65, max: 80 },
  dragon_lair: { min: 80, max: 90 },
  pantheon_gods: { min: 90, max: 100 }
} as const;

/**
 * Проверяет, может ли игрок получить опыт в данном подземелье
 */
export const canGainExperienceInDungeon = (dungeonType: DungeonType, playerLevel: number): boolean => {
  const range = dungeonLevelRanges[dungeonType];
  if (!range) return false;
  return playerLevel >= range.min && playerLevel < range.max;
};