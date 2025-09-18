export type Language = 'ru' | 'en';

export const itemTranslations = {
  ru: {
    // Item names
    "Паучий шелк": "Паучий шелк",
    "Яд паука": "Яд паука",
    "Клык паука": "Клык паука",
    "Глаз паука": "Глаз паука",
    "Хелицеры": "Хелицеры",
    "Фрагмент хитина": "Фрагмент хитина",
    "Конечности паука": "Конечности паука",
    "Сухожилия паука": "Сухожилия паука",
    "Ядовитая железа": "Ядовитая железа",
    "Яйца паука": "Яйца паука",
    "Кость паука-скелета": "Кость паука-скелета",
    "Пыльца иллюзий": "Пыльца иллюзий",
    "Крыло виверны": "Крыло виверны",
    "Коготь охотника": "Коготь охотника",
    "Ядро шелка": "Ядро шелка",
    "Улучшенный хитин стража": "Улучшенный хитин стража",
    "Жало личинки королевы": "Жало личинки королевы",
    "Концентрированная ядовитая железа": "Концентрированная ядовитая железа",
    "Глаз древнего отшельника": "Глаз древнего отшельника",
    "Железа теневой паутины": "Железа теневой паутины",

    // Item types
    "weapon": "Оружие",
    "armor": "Броня",
    "accessory": "Аксессуар",
    "consumable": "Расходники",

    // Rarity
    "common": "Обычный",
    "rare": "Редкий",
    "epic": "Эпический",
    "legendary": "Легендарный",

    // Source types
    "monster_drop": "Добыча с монстров",
    "boss_drop": "Добыча с боссов",
    "craft": "Крафт",
    "crafting": "Крафт",
    "quest_reward": "Награда за квест",

    // Stats
    "power": "Сила",
    "defense": "Защита",
    "health": "Здоровье",
    "heal": "Лечение",
    "fire_damage": "Урон огнем",
    "magic_resistance": "Сопр. магии",

    // UI text
    "Характеристики:": "Характеристики:",
    "Детали:": "Детали:",
    "Уровень": "Уровень",
    "Стоимость": "Стоимость",
    "Шанс": "Шанс",
    "Требуемый уровень": "Требуемый уровень",
    "Шанс выпадения": "Шанс выпадения",
    "монет": "монет",
    "Загрузка предметов...": "Загрузка предметов...",
    "Все": "Все",
    "Любые монстры": "Любые монстры",
    "Неизвестно": "Неизвестно"
  },
  en: {
    // Item names
    "Паучий шелк": "Spider Silk",
    "Яд паука": "Spider Poison",
    "Клык паука": "Spider Fang",
    "Глаз паука": "Spider Eye",
    "Хелицеры": "Chelicerae",
    "Фрагмент хитина": "Chitin Fragment",
    "Конечности паука": "Spider Limbs",
    "Сухожилия паука": "Spider Tendons",
    "Ядовитая железа": "Poison Gland",
    "Яйца паука": "Spider Eggs",
    "Кость паука-скелета": "Skeleton Spider Bone",
    "Пыльца иллюзий": "Illusion Pollen",
    "Крыло виверны": "Wyvern Wing",
    "Коготь охотника": "Hunter Claw",
    "Ядро шелка": "Silk Core",
    "Улучшенный хитин стража": "Enhanced Guardian Chitin",
    "Жало личинки королевы": "Queen Larva Stinger",
    "Концентрированная ядовитая железа": "Concentrated Poison Gland",
    "Глаз древнего отшельника": "Ancient Hermit Eye",
    "Железа теневой паутины": "Shadow Web Gland",

    // Item types
    "weapon": "Weapon",
    "armor": "Armor",
    "accessory": "Accessory",
    "consumable": "Consumables",

    // Rarity
    "common": "Common",
    "rare": "Rare",
    "epic": "Epic",
    "legendary": "Legendary",

    // Source types
    "monster_drop": "Monster Drop",
    "boss_drop": "Boss Drop",
    "craft": "Craft",
    "crafting": "Craft",
    "quest_reward": "Quest Reward",

    // Stats
    "power": "Power",
    "defense": "Defense",
    "health": "Health",
    "heal": "Heal",
    "fire_damage": "Fire Damage",
    "magic_resistance": "Magic Resistance",

    // UI text
    "Характеристики:": "Stats:",
    "Детали:": "Details:",
    "Уровень": "Level",
    "Стоимость": "Cost",
    "Шанс": "Chance",
    "Требуемый уровень": "Required Level",
    "Шанс выпадения": "Drop Chance",
    "монет": "coins",
    "Загрузка предметов...": "Loading items...",
    "Все": "All",
    "Любые монстры": "Any monsters",
    "Неизвестно": "Unknown"
  }
};

export const translateItemName = (language: Language, name: string): string => {
  return itemTranslations[language][name] || name;
};

export const translateItemType = (language: Language, type: string): string => {
  return itemTranslations[language][type] || type;
};

export const translateRarity = (language: Language, rarity: string): string => {
  return itemTranslations[language][rarity] || rarity;
};

export const translateSourceType = (language: Language, sourceType: string): string => {
  return itemTranslations[language][sourceType] || sourceType;
};

export const translateStat = (language: Language, stat: string): string => {
  return itemTranslations[language][stat] || stat;
};

export const translateItemText = (language: Language, text: string): string => {
  return itemTranslations[language][text] || text;
};