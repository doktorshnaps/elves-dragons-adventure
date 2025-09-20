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
    "Клык берсерка": "Клык берсерка",
    "Сердце виверны": "Сердце виверны",
    "Панцирь титана": "Панцирь титана",
    "Коготь трупоеда": "Коготь трупоеда",
    "Железа паразита": "Железа паразита",
    "Яйцо стражи": "Яйцо стражи",
    "Символ паутины": "Символ паутины",
    "Посох Архимага": "Посох Архимага",
    "Мантия из живой тени": "Мантия из живой тени",
    "Гримуар арахнидных заклинаний": "Гримуар арахнидных заклинаний",
    
    // Предметы Арахны
    "Осколок души Архимага": "Осколок души Архимага",
    "Сердце Прародительницы": "Сердце Прародительницы",
    "Брюшная железа Арахны": "Брюшная железа Арахны",
    "Яйцо Прародительницы": "Яйцо Прародительницы",
    "Глаз Примаса": "Глаз Примаса",
    "Лапа Арахны": "Лапа Арахны",
    "Венец Арахны": "Венец Арахны",
    "Плащ из пепельных нитей": "Плащ из пепельных нитей",

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
    "speedBoost": "Ускорение",
    "workDuration": "Время работы",

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
    "Клык берсерка": "Berserker's Fang",
    "Сердце виверны": "Wyvern Heart",
    "Панцирь титана": "Titan Shell",
    "Коготь трупоеда": "Carrion Claw",
    "Железа паразита": "Parasite Gland",
    "Яйцо стражи": "Guardian Egg",
    "Символ паутины": "Web Symbol",
    "Посох Архимага": "Archmage Staff",
    "Мантия из живой тени": "Living Shadow Mantle",
    "Гримуар арахнидных заклинаний": "Arachnid Spells Grimoire",
    
    // Предметы Арахны
    "Осколок души Архимага": "Archmage Soul Shard",
    "Сердце Прародительницы": "Progenitor Heart",
    "Брюшная железа Арахны": "Arachne Silk Gland",
    "Яйцо Прародительницы": "Progenitor Egg",
    "Глаз Примаса": "Primas Eye",
    "Лапа Арахны": "Arachne Claw",
    "Венец Арахны": "Arachne Crown",
    "Плащ из пепельных нитей": "Ashen Threads Cloak",

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
    "speedBoost": "Speed Boost",
    "workDuration": "Work Duration",

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