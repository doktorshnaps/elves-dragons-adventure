// Маппинг ID предметов на их названия
export const itemNames: Record<string, { ru: string; en: string }> = {
  dragon_egg: {
    ru: 'Яйцо дракона',
    en: 'Dragon Egg'
  },
  cardPack: {
    ru: 'Колода карт',
    en: 'Card Pack'
  },
  healthPotion: {
    ru: 'Зелье здоровья',
    en: 'Health Potion'
  },
  defensePotion: {
    ru: 'Зелье защиты',
    en: 'Defense Potion'
  },
  worker: {
    ru: 'Рабочий',
    en: 'Worker'
  },
  material: {
    ru: 'Материал',
    en: 'Material'
  },
  weapon: {
    ru: 'Оружие',
    en: 'Weapon'
  },
  armor: {
    ru: 'Броня',
    en: 'Armor'
  },
  accessory: {
    ru: 'Аксессуар',
    en: 'Accessory'
  },
  woodChunks: {
    ru: 'Куски дерева',
    en: 'Wood Chunks'
  },
  magicalRoots: {
    ru: 'Магические корни',
    en: 'Magical Roots'
  },
  rockStones: {
    ru: 'Камни',
    en: 'Rock Stones'
  },
  blackCrystals: {
    ru: 'Черные кристаллы',
    en: 'Black Crystals'
  },
  illusionManuscript: {
    ru: 'Рукопись иллюзий',
    en: 'Illusion Manuscript'
  },
  darkMonocle: {
    ru: 'Темный монокль',
    en: 'Dark Monocle'
  },
  etherVine: {
    ru: 'Эфирная лоза',
    en: 'Ether Vine'
  },
  dwarvenTongs: {
    ru: 'Дварфийские щипцы',
    en: 'Dwarven Tongs'
  },
  healingOil: {
    ru: 'Масло исцеления',
    en: 'Healing Oil'
  },
  shimmeringCrystal: {
    ru: 'Мерцающий кристалл',
    en: 'Shimmering Crystal'
  },
  lifeCrystal: {
    ru: 'Кристалл жизни',
    en: 'Life Crystal'
  }
};

export const getItemName = (itemId: string, language: 'ru' | 'en' = 'ru'): string => {
  return itemNames[itemId]?.[language] || itemId;
};
