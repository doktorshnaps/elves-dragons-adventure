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

export const resolveItemKey = (rawId: string): string => {
  if (!rawId) return '';
  const id = String(rawId);
  const candidates = new Set<string>([
    id,
    id.toLowerCase(),
    id.replace(/[\s-]/g, '_'),
    id.replace(/_/g, ''),
    id.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
    id.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
    id.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase(),
  ]);

  const synonyms: Record<string, string> = {
    dragonEgg: 'dragon_egg',
    'dragon egg': 'dragon_egg',
    dragon_egg: 'dragon_egg',
    card_pack: 'cardPack',
    cardpack: 'cardPack',
    health_potion: 'healthPotion',
    defense_potion: 'defensePotion',
    wood_chunks: 'woodChunks',
    magical_roots: 'magicalRoots',
    rock_stones: 'rockStones',
    black_crystals: 'blackCrystals',
    illusion_manuscript: 'illusionManuscript',
    dark_monocle: 'darkMonocle',
    ether_vine: 'etherVine',
    dwarven_tongs: 'dwarvenTongs',
    healing_oil: 'healingOil',
    shimmering_crystal: 'shimmeringCrystal',
    life_crystal: 'lifeCrystal',
  };

  // Add direct synonym mapping candidates
  Object.entries(synonyms).forEach(([k, v]) => {
    if (k === id || k === id.toLowerCase() || k === id.replace(/[\s-]/g, '_')) {
      candidates.add(v);
    }
  });

  for (const key of candidates) {
    if (itemNames[key]) return key;
  }
  for (const key of candidates) {
    const v = synonyms[key];
    if (v && itemNames[v]) return v;
  }
  return id;
};

export const getItemName = (itemId: string, language: 'ru' | 'en' = 'ru'): string => {
  const key = resolveItemKey(itemId);
  return itemNames[key]?.[language] || key;
};
