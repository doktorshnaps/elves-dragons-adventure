// Upgrade requirements and success chances for Barracks and Dragon Lair

export interface UpgradeRequirement {
  rarity: number;
  successChance: number; // 0-100
  costs: {
    balance?: number;
    wood?: number;
    stone?: number;
  };
  requiredItems: {
    itemId: string;
    name: string;
    quantity: number;
  }[];
}

export const BARRACKS_UPGRADE_REQUIREMENTS: UpgradeRequirement[] = [
  {
    rarity: 1,
    successChance: 90,
    costs: { balance: 100, wood: 50 },
    requiredItems: [
      { itemId: 'woodChunks', name: 'Деревянные обломки', quantity: 2 }
    ]
  },
  {
    rarity: 2,
    successChance: 80,
    costs: { balance: 300, wood: 100, stone: 50 },
    requiredItems: [
      { itemId: 'rockStones', name: 'Камни', quantity: 3 },
      { itemId: 'woodChunks', name: 'Деревянные обломки', quantity: 3 }
    ]
  },
  {
    rarity: 3,
    successChance: 70,
    costs: { balance: 600, wood: 200, stone: 100 },
    requiredItems: [
      { itemId: 'blackCrystals', name: 'Чёрные кристаллы', quantity: 2 },
      { itemId: 'rockStones', name: 'Камни', quantity: 5 }
    ]
  },
  {
    rarity: 4,
    successChance: 60,
    costs: { balance: 1200, wood: 300, stone: 200 },
    requiredItems: [
      { itemId: 'magicalRoots', name: 'Магические корни', quantity: 3 },
      { itemId: 'blackCrystals', name: 'Чёрные кристаллы', quantity: 3 }
    ]
  },
  {
    rarity: 5,
    successChance: 50,
    costs: { balance: 2500, stone: 400 },
    requiredItems: [
      { itemId: 'illusionManuscript', name: 'Манускрипт иллюзий', quantity: 2 },
      { itemId: 'shimmeringCrystal', name: 'Мерцающий кристалл', quantity: 2 }
    ]
  },
  {
    rarity: 6,
    successChance: 40,
    costs: { balance: 5000 },
    requiredItems: [
      { itemId: 'darkMonocle', name: 'Тёмный монокль', quantity: 2 },
      { itemId: 'etherVine', name: 'Эфирная лоза', quantity: 3 }
    ]
  },
  {
    rarity: 7,
    successChance: 30,
    costs: { balance: 10000 },
    requiredItems: [
      { itemId: 'lifeCrystal', name: 'Кристалл жизни', quantity: 3 },
      { itemId: 'healingOil', name: 'Целебное масло', quantity: 4 }
    ]
  }
];

export const DRAGON_LAIR_UPGRADE_REQUIREMENTS: UpgradeRequirement[] = [
  {
    rarity: 1,
    successChance: 85,
    costs: { balance: 150, wood: 80 },
    requiredItems: [
      { itemId: 'woodChunks', name: 'Деревянные обломки', quantity: 3 }
    ]
  },
  {
    rarity: 2,
    successChance: 75,
    costs: { balance: 400, wood: 150, stone: 80 },
    requiredItems: [
      { itemId: 'magicalRoots', name: 'Магические корни', quantity: 2 },
      { itemId: 'rockStones', name: 'Камни', quantity: 3 }
    ]
  },
  {
    rarity: 3,
    successChance: 65,
    costs: { balance: 800, wood: 250, stone: 150 },
    requiredItems: [
      { itemId: 'blackCrystals', name: 'Чёрные кристаллы', quantity: 3 },
      { itemId: 'magicalRoots', name: 'Магические корни', quantity: 4 }
    ]
  },
  {
    rarity: 4,
    successChance: 55,
    costs: { balance: 1500, wood: 400, stone: 250 },
    requiredItems: [
      { itemId: 'etherVine', name: 'Эфирная лоза', quantity: 2 },
      { itemId: 'blackCrystals', name: 'Чёрные кристаллы', quantity: 4 }
    ]
  },
  {
    rarity: 5,
    successChance: 45,
    costs: { balance: 3000, stone: 500 },
    requiredItems: [
      { itemId: 'shimmeringCrystal', name: 'Мерцающий кристалл', quantity: 3 },
      { itemId: 'healingOil', name: 'Целебное масло', quantity: 3 }
    ]
  },
  {
    rarity: 6,
    successChance: 35,
    costs: { balance: 6000 },
    requiredItems: [
      { itemId: 'lifeCrystal', name: 'Кристалл жизни', quantity: 2 },
      { itemId: 'darkMonocle', name: 'Тёмный монокль', quantity: 3 }
    ]
  },
  {
    rarity: 7,
    successChance: 25,
    costs: { balance: 12000 },
    requiredItems: [
      { itemId: 'lifeCrystal', name: 'Кристалл жизни', quantity: 4 },
      { itemId: 'dwarvenTongs', name: 'Гномьи щипцы', quantity: 3 }
    ]
  }
];

export function getUpgradeRequirement(
  rarity: number, 
  type: 'barracks' | 'dragonLair'
): UpgradeRequirement | undefined {
  const requirements = type === 'barracks' 
    ? BARRACKS_UPGRADE_REQUIREMENTS 
    : DRAGON_LAIR_UPGRADE_REQUIREMENTS;
  
  return requirements.find(req => req.rarity === rarity);
}

export function rollUpgradeSuccess(successChance: number): boolean {
  return Math.random() * 100 < successChance;
}
