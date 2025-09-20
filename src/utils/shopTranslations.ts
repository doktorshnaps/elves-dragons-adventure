export type Language = 'ru' | 'en';

export const shopItemTranslations = {
  ru: {
    // Card Packs
    "Колода карт": "Колода карт",
    
    // Workers
    "Пылевой Батрак": "Пылевой Батрак",
    "Угольный Носильщик": "Угольный Носильщик", 
    "Ремесленник": "Ремесленник",
    "Мастер": "Мастер",
    "Гроссмейстер": "Гроссмейстер",
    
    // Descriptions
    "Содержит 1 случайную карту героя или питомца": "Содержит 1 случайную карту героя или питомца",
    "Обычный рабочий. Работает 2 часа, ускорение +10%": "Обычный рабочий. Работает 2 часа, ускорение +10%",
    "Опытный рабочий. Работает 4 часа, ускорение +20%": "Опытный рабочий. Работает 4 часа, ускорение +20%",
    "Искусный рабочий. Работает 6 часов, ускорение +30%": "Искусный рабочий. Работает 6 часов, ускорение +30%",
    "Талантливый рабочий. Работает 8 часов, ускорение +40%": "Талантливый рабочий. Работает 8 часов, ускорение +40%",
    "Элитный рабочий. Работает 12 часов, ускорение +50%": "Элитный рабочий. Работает 12 часов, ускорение +50%"
  },
  en: {
    // Card Packs
    "Колода карт": "Card Pack",
    
    // Workers
    "Пылевой Батрак": "Dust Worker",
    "Угольный Носильщик": "Coal Carrier",
    "Ремесленник": "Craftsman", 
    "Мастер": "Master",
    "Гроссмейстер": "Grandmaster",
    
    // Descriptions
    "Содержит 1 случайную карту героя или питомца": "Contains 1 random hero or pet card",
    "Обычный рабочий. Работает 2 часа, ускорение +10%": "Common worker. Works 2 hours, +10% speed boost",
    "Опытный рабочий. Работает 4 часа, ускорение +20%": "Experienced worker. Works 4 hours, +20% speed boost",
    "Искусный рабочий. Работает 6 часов, ускорение +30%": "Skilled worker. Works 6 hours, +30% speed boost",
    "Талантливый рабочий. Работает 8 часов, ускорение +40%": "Talented worker. Works 8 hours, +40% speed boost",
    "Элитный рабочий. Работает 12 часов, ускорение +50%": "Elite worker. Works 12 hours, +50% speed boost"
  }
};

export const translateShopItemName = (language: Language, name: string): string => {
  return shopItemTranslations[language][name] || name;
};

export const translateShopItemDescription = (language: Language, description: string): string => {
  return shopItemTranslations[language][description] || description;
};