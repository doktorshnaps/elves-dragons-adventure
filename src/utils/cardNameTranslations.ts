import { Language } from './translations';

// Mapping of card names from Russian to English
export const cardNameTranslations: Record<string, Record<Language, string>> = {
  // Heroes - Common Russian names that might be in the game
  'Воин': {
    ru: 'Воин',
    en: 'Warrior'
  },
  'Маг': {
    ru: 'Маг',
    en: 'Mage'
  },
  'Лучник': {
    ru: 'Лучник',
    en: 'Archer'
  },
  'Рыцарь': {
    ru: 'Рыцарь',
    en: 'Knight'
  },
  'Паладин': {
    ru: 'Паладин',
    en: 'Paladin'
  },
  'Жрец': {
    ru: 'Жрец',
    en: 'Priest'
  },
  'Разбойник': {
    ru: 'Разбойник',
    en: 'Rogue'
  },
  'Варвар': {
    ru: 'Варвар',
    en: 'Barbarian'
  },
  'Друид': {
    ru: 'Друид',
    en: 'Druid'
  },
  'Некромант': {
    ru: 'Некромант',
    en: 'Necromancer'
  },
  'Чернокнижник': {
    ru: 'Чернокнижник',
    en: 'Warlock'
  },
  'Монах': {
    ru: 'Монах',
    en: 'Monk'
  },
  'Следопыт': {
    ru: 'Следопыт',
    en: 'Ranger'
  },
  'Ассасин': {
    ru: 'Ассасин',
    en: 'Assassin'
  },
  'Шаман': {
    ru: 'Шаман',
    en: 'Shaman'
  },
  
  // Dragons - Common dragon names
  'Дракон': {
    ru: 'Дракон',
    en: 'Dragon'
  },
  'Красный дракон': {
    ru: 'Красный дракон',
    en: 'Red Dragon'
  },
  'Синий дракон': {
    ru: 'Синий дракон',
    en: 'Blue Dragon'
  },
  'Зеленый дракон': {
    ru: 'Зеленый дракон',
    en: 'Green Dragon'
  },
  'Черный дракон': {
    ru: 'Черный дракон',
    en: 'Black Dragon'
  },
  'Белый дракон': {
    ru: 'Белый дракон',
    en: 'White Dragon'
  },
  'Золотой дракон': {
    ru: 'Золотой дракон',
    en: 'Golden Dragon'
  },
  'Ледяной дракон': {
    ru: 'Ледяной дракон',
    en: 'Ice Dragon'
  },
  'Огненный дракон': {
    ru: 'Огненный дракон',
    en: 'Fire Dragon'
  },
  'Теневой дракон': {
    ru: 'Теневой дракон',
    en: 'Shadow Dragon'
  },
  'Древний дракон': {
    ru: 'Древний дракон',
    en: 'Ancient Dragon'
  },
  'Молодой дракон': {
    ru: 'Молодой дракон',
    en: 'Young Dragon'
  },
  'Драконёнок': {
    ru: 'Драконёнок',
    en: 'Dragon Hatchling'
  },
  'Морской дракон': {
    ru: 'Морской дракон',
    en: 'Sea Dragon'
  },
  'Небесный дракон': {
    ru: 'Небесный дракон',
    en: 'Sky Dragon'
  },
  
  // Pets/Companions
  'Волк': {
    ru: 'Волк',
    en: 'Wolf'
  },
  'Медведь': {
    ru: 'Медведь',
    en: 'Bear'
  },
  'Орел': {
    ru: 'Орел',
    en: 'Eagle'
  },
  'Змея': {
    ru: 'Змея',
    en: 'Snake'
  },
  'Феникс': {
    ru: 'Феникс',
    en: 'Phoenix'
  },
  'Единорог': {
    ru: 'Единорог',
    en: 'Unicorn'
  },
  'Грифон': {
    ru: 'Грифон',
    en: 'Griffin'
  }
};

/**
 * Get translated card name based on current language
 * If no translation exists, returns the original name
 */
export const getTranslatedCardName = (cardName: string, language: Language): string => {
  if (!cardName) return '';
  
  // Check if we have a translation for this exact name
  if (cardNameTranslations[cardName]) {
    return cardNameTranslations[cardName][language];
  }
  
  // If no exact match, try to find partial matches (for composite names like "Огненный Воин")
  for (const [key, translations] of Object.entries(cardNameTranslations)) {
    if (cardName.includes(key)) {
      // For composite names, translate each part
      let translatedName = cardName;
      for (const [origName, trans] of Object.entries(cardNameTranslations)) {
        if (cardName.includes(origName)) {
          translatedName = translatedName.replace(origName, trans[language]);
        }
      }
      return translatedName;
    }
  }
  
  // If no translation found, return original name
  return cardName;
};
