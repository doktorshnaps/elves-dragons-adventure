export const dungeonBackgrounds = {
  "dragon_lair": "/lovable-uploads/7b2107b3-2cc1-440f-bb39-43a98c2a1e1a.png",
  "forgotten_souls": "/lovable-uploads/3445a1d0-8e5a-4785-bcce-f3b88bbd6f14.png",
  "ice_throne": "/lovable-uploads/301f4f03-6a87-48ec-a535-535b2213026f.png",
  "dark_mage": "/lovable-uploads/abf6e9af-a611-414c-b213-fed11ae0a767.png",
  "spider_nest": "/lovable-uploads/ebf85dda-c79b-4350-80c2-65fde21b31ad.png",
  "bone_dungeon": "/lovable-uploads/aef9e591-e676-4552-a70d-c7457b29b6c5.png",
  "sea_serpent": "/lovable-uploads/d832d29a-6ce9-4bad-abaa-d15cb73b5382.png"
} as const;

export const dungeons = [
  "dragon_lair",
  "forgotten_souls", 
  "ice_throne",
  "dark_mage",
  "spider_nest",
  "bone_dungeon",
  "sea_serpent"
] as const;

export const dungeonNames = {
  dragon_lair: "Логово Черного Дракона",
  forgotten_souls: "Пещеры Забытых Душ",
  ice_throne: "Трон Ледяного Короля",
  dark_mage: "Лабиринт Темного Мага",
  spider_nest: "Гнездо Гигантских Пауков",
  bone_dungeon: "Темница Костяных Демонов",
  sea_serpent: "Логово Морского Змея"
} as const;

export const dungeonRoutes = {
  dragon_lair: "/dungeons/dragon-lair",
  forgotten_souls: "/dungeons/forgotten-souls",
  ice_throne: "/dungeons/ice-throne",
  dark_mage: "/dungeons/dark-mage",
  spider_nest: "/dungeons/spider-nest",
  bone_dungeon: "/dungeons/bone-dungeon",
  sea_serpent: "/dungeons/sea-serpent"
} as const;

export type DungeonType = keyof typeof dungeonNames;