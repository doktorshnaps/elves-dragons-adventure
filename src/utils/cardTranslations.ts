export type Language = 'ru' | 'en';

export const cardTranslations = {
  ru: {
    // Kaledor Heroes
    "Рекрут": "Рекрут",
    "Страж": "Страж", 
    "Паладин": "Паладин",
    "Генерал": "Генерал",
    "Император": "Император",
    
    // Sylvanesti Heroes
    "Лесной Рейнджер": "Лесной Рейнджер",
    "Следопыт": "Следопыт",
    "Друид": "Друид",
    "Архидруид": "Архидруид",
    "Повелитель Леса": "Повелитель Леса",
    
    // Faelin Heroes
    "Ученик Мага": "Ученик Мага",
    "Маг": "Маг",
    "Волшебник": "Волшебник",
    "Архимаг": "Архимаг",
    "Верховный Маг": "Верховный Маг",
    
    // Ellenar Heroes
    "Ассасин": "Ассасин",
    "Убийца": "Убийца",
    "Мастер Теней": "Мастер Теней",
    "Призрачный Клинок": "Призрачный Клинок",
    "Властитель Тьмы": "Властитель Тьмы",
    
    // Telerion Heroes
    "Монах": "Монах",
    "Целитель": "Целитель",
    "Жрец": "Жрец",
    "Первосвященник": "Первосвященник",
    "Божественный Оракул": "Божественный Оракул",
    
    // Aelantir Heroes
    "Кузнец": "Кузнец",
    "Инженер": "Инженер",
    "Мастер": "Мастер",
    "Изобретатель": "Изобретатель",
    "Великий Архитектор": "Великий Архитектор",
    
    // Lioras Heroes
    "Наемник": "Наемник",
    "Разбойник": "Разбойник",
    "Капитан": "Капитан",
    "Адмирал": "Адмирал",
    "Повелитель Морей": "Повелитель Морей",
    
    // Dragon names would go here...
    "Малый Огненный Дракон": "Малый Огненный Дракон",
    "Огненный Дракон": "Огненный Дракон",
    // ... more dragons
    
    // Factions
    "Каледор": "Каледор",
    "Сильванести": "Сильванести", 
    "Фаэлин": "Фаэлин",
    "Элленар": "Элленар",
    "Телерион": "Телерион",
    "Аэлантир": "Аэлантир",
    "Лиорас": "Лиорас"
  },
  en: {
    // Kaledor Heroes
    "Рекрут": "Recruit",
    "Страж": "Guardian",
    "Паладин": "Paladin", 
    "Генерал": "General",
    "Император": "Emperor",
    
    // Sylvanesti Heroes
    "Лесной Рейнджер": "Forest Ranger",
    "Следопыт": "Tracker",
    "Друид": "Druid",
    "Архидруид": "Archdruid",
    "Повелитель Леса": "Forest Lord",
    
    // Faelin Heroes
    "Ученик Мага": "Mage Apprentice",
    "Маг": "Mage",
    "Волшебник": "Wizard",
    "Архимаг": "Archmage",
    "Верховный Маг": "Supreme Mage",
    
    // Ellenar Heroes
    "Ассасин": "Assassin",
    "Убийца": "Killer",
    "Мастер Теней": "Shadow Master",
    "Призрачный Клинок": "Ghost Blade",
    "Властитель Тьмы": "Dark Lord",
    
    // Telerion Heroes
    "Монах": "Monk",
    "Целитель": "Healer",
    "Жрец": "Priest",
    "Первосвященник": "High Priest",
    "Божественный Оракул": "Divine Oracle",
    
    // Aelantir Heroes
    "Кузнец": "Blacksmith",
    "Инженер": "Engineer",
    "Мастер": "Master",
    "Изобретатель": "Inventor",
    "Великий Архитектор": "Grand Architect",
    
    // Lioras Heroes
    "Наемник": "Mercenary",
    "Разбойник": "Bandit",
    "Капитан": "Captain",
    "Адмирал": "Admiral",
    "Повелитель Морей": "Sea Lord",
    
    // Dragon names
    "Малый Огненный Дракон": "Lesser Fire Dragon",
    "Огненный Дракон": "Fire Dragon",
    // ... more dragons
    
    // Factions
    "Каледор": "Kaledor",
    "Сильванести": "Sylvanesti",
    "Фаэлин": "Faelin", 
    "Элленар": "Ellenar",
    "Телерион": "Telerion",
    "Аэлантир": "Aelantir",
    "Лиорас": "Lioras"
  }
};

export const translateCardName = (language: Language, name: string): string => {
  return cardTranslations[language][name] || name;
};

export const translateFaction = (language: Language, faction: string): string => {
  return cardTranslations[language][faction] || faction;
};