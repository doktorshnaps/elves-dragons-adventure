import { Card, CardType, Rarity, Faction, MagicResistance } from "@/types/cards";
import { cardDatabase } from "@/data/cardDatabase";
import { supabase } from "@/integrations/supabase/client";

// Кэш для результатов calculateCardStats
const statsCache = new Map<string, { power: number; defense: number; health: number; magic: number }>();

// Глобальный кеш настроек игры
let gameSettingsCache: {
  heroBaseStats: { health: number; defense: number; power: number; magic: number } | null;
  dragonBaseStats: { health: number; defense: number; power: number; magic: number } | null;
  rarityMultipliers: Record<number, number>;
  classMultipliers: Record<string, { health_multiplier: number; defense_multiplier: number; power_multiplier: number; magic_multiplier: number }>;
  dragonClassMultipliers: Record<string, { health_multiplier: number; defense_multiplier: number; power_multiplier: number; magic_multiplier: number }>;
  lastLoaded: number;
} = {
  heroBaseStats: null,
  dragonBaseStats: null,
  rarityMultipliers: {},
  classMultipliers: {},
  dragonClassMultipliers: {},
  lastLoaded: 0
};

// Загрузка настроек из БД - используем .maybeSingle() вместо .single()
const loadGameSettings = async () => {
  const now = Date.now();
  // Кеш на 30 секунд (увеличен с 5 для снижения частоты запросов)
  if (now - gameSettingsCache.lastLoaded < 30000 && gameSettingsCache.heroBaseStats) {
    return;
  }

  try {
    const [heroRes, dragonRes, rarityRes, classRes, dragonClassRes] = await Promise.all([
      supabase.from('hero_base_stats').select('*').limit(1).maybeSingle(),
      supabase.from('dragon_base_stats').select('*').limit(1).maybeSingle(),
      supabase.from('rarity_multipliers').select('*').order('rarity'),
      supabase.from('class_multipliers').select('*'),
      supabase.from('dragon_class_multipliers').select('*')
    ]);

    if (heroRes.data) {
      gameSettingsCache.heroBaseStats = {
        health: heroRes.data.health,
        defense: heroRes.data.defense,
        power: heroRes.data.power,
        magic: heroRes.data.magic
      };
    }

    if (dragonRes.data) {
      gameSettingsCache.dragonBaseStats = {
        health: dragonRes.data.health,
        defense: dragonRes.data.defense,
        power: dragonRes.data.power,
        magic: dragonRes.data.magic
      };
    }

    if (rarityRes.data) {
      gameSettingsCache.rarityMultipliers = rarityRes.data.reduce((acc: Record<number, number>, r: any) => {
        acc[r.rarity] = Number(r.multiplier);
        return acc;
      }, {});
    }

    if (classRes.data) {
      gameSettingsCache.classMultipliers = classRes.data.reduce((acc: any, c: any) => {
        acc[c.class_name] = {
          health_multiplier: Number(c.health_multiplier),
          defense_multiplier: Number(c.defense_multiplier),
          power_multiplier: Number(c.power_multiplier),
          magic_multiplier: Number(c.magic_multiplier)
        };
        return acc;
      }, {});
    }

    if (dragonClassRes.data) {
      gameSettingsCache.dragonClassMultipliers = dragonClassRes.data.reduce((acc: any, c: any) => {
        acc[c.class_name] = {
          health_multiplier: Number(c.health_multiplier),
          defense_multiplier: Number(c.defense_multiplier),
          power_multiplier: Number(c.power_multiplier),
          magic_multiplier: Number(c.magic_multiplier)
        };
        return acc;
      }, {});
    }

    gameSettingsCache.lastLoaded = now;
    // Очищаем кэш статистик при загрузке новых настроек
    statsCache.clear();
  } catch (error) {
    console.error('Error loading game settings:', error);
  }
};

// Инициализация при загрузке модуля
loadGameSettings();

// Функция для принудительного обновления кеша
export const refreshGameSettings = async () => {
  gameSettingsCache.lastLoaded = 0;
  statsCache.clear();
  classMultiplierCache.clear();
  await loadGameSettings();
};

export const getRarityLabel = (rarity: Rarity): string => {
  return "⭐".repeat(rarity);
};

export const getCardPrice = (rarity: Rarity): number => {
  return 500;
};

const FACTIONS: Faction[] = [
  'Каледор',
  'Сильванести',
  'Фаэлин',
  'Элленар',
  'Тэлэрион',
  'Аэлантир',
  'Лиорас'
];

const getMagicResistanceByFaction = (faction: Faction): MagicResistance => {
  const resistanceMap: Record<Faction, MagicResistance> = {
    'Лиорас': { type: 'природа', value: 20 },
    'Аэлантир': { type: 'земля', value: 20 },
    'Тэлэрион': { type: 'тьма', value: 20 },
    'Элленар': { type: 'свет', value: 20 },
    'Фаэлин': { type: 'вода', value: 20 },
    'Сильванести': { type: 'песок', value: 20 },
    'Каледор': { type: 'лед', value: 20 }
  };
  
  return resistanceMap[faction];
};

// Fallback базовые характеристики (если БД недоступна)
const FALLBACK_HERO_STATS = {
  health: 100,
  defense: 25,
  power: 20,
  magic: 15
};

const FALLBACK_PET_STATS = {
  health: 80,
  defense: 20,
  power: 25,
  magic: 30
};

// Fallback множители редкости
const FALLBACK_RARITY_MULTIPLIERS: Record<Rarity, number> = {
  1: 1.0,
  2: 1.6,
  3: 2.4,
  4: 3.4,
  5: 4.8,
  6: 6.9,
  7: 10.0,
  8: 14.5
};

// Получить множитель класса по имени карты из БД (с кэшированием)
const classMultiplierCache = new Map<string, any>();

const getClassMultiplier = (cardName: string, cardType: CardType) => {
  const cacheKey = `${cardName}_${cardType}`;
  
  if (classMultiplierCache.has(cacheKey)) {
    return classMultiplierCache.get(cacheKey);
  }

  let result;
  
  if (cardType === 'pet') {
    // Для драконов ищем класс в названии
    const sortedClasses = Object.keys(gameSettingsCache.dragonClassMultipliers).sort((a, b) => b.length - a.length);
    
    for (const dragonClass of sortedClasses) {
      if (cardName.includes(dragonClass)) {
        result = gameSettingsCache.dragonClassMultipliers[dragonClass];
        classMultiplierCache.set(cacheKey, result);
        return result;
      }
    }
    // Fallback
    result = { health_multiplier: 1.0, defense_multiplier: 1.0, power_multiplier: 1.0, magic_multiplier: 1.0 };
  } else {
    // Для героев ищем класс в названии карты (от более длинного к более короткому)
    const sortedClasses = Object.keys(gameSettingsCache.classMultipliers).sort((a, b) => b.length - a.length);
    
    for (const heroClass of sortedClasses) {
      if (cardName.includes(heroClass)) {
        result = gameSettingsCache.classMultipliers[heroClass];
        classMultiplierCache.set(cacheKey, result);
        return result;
      }
    }
    
    // Fallback
    result = { health_multiplier: 1.0, defense_multiplier: 1.0, power_multiplier: 1.0, magic_multiplier: 1.0 };
  }
  
  classMultiplierCache.set(cacheKey, result);
  return result;
};

export const getStatsForRarity = (rarity: Rarity, cardType: CardType = 'character') => {
  const multiplier = gameSettingsCache.rarityMultipliers[rarity] || FALLBACK_RARITY_MULTIPLIERS[rarity] || 1.0;
  const baseStats = cardType === 'pet' 
    ? (gameSettingsCache.dragonBaseStats || FALLBACK_PET_STATS)
    : (gameSettingsCache.heroBaseStats || FALLBACK_HERO_STATS);
  
  return {
    power: Math.floor(baseStats.power * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    health: Math.floor(baseStats.health * multiplier),
    magic: Math.floor(baseStats.magic * multiplier)
  };
};

// Новая функция для расчета характеристик карты с КЭШИРОВАНИЕМ
export const calculateCardStats = (cardName: string, rarity: Rarity, cardType: CardType = 'character') => {
  // Создаем ключ кэша
  const cacheKey = `${cardName}_${rarity}_${cardType}`;
  
  // Проверяем кэш
  if (statsCache.has(cacheKey)) {
    return statsCache.get(cacheKey)!;
  }
  
  const classMultiplier = getClassMultiplier(cardName, cardType);
  const rarityMultiplier = gameSettingsCache.rarityMultipliers[rarity] || FALLBACK_RARITY_MULTIPLIERS[rarity] || 1.0;
  
  const baseStats = cardType === 'pet' 
    ? (gameSettingsCache.dragonBaseStats || FALLBACK_PET_STATS)
    : (gameSettingsCache.heroBaseStats || FALLBACK_HERO_STATS);
  
  const result = {
    power: Math.floor(baseStats.power * rarityMultiplier * classMultiplier.power_multiplier),
    defense: Math.floor(baseStats.defense * rarityMultiplier * classMultiplier.defense_multiplier),
    health: Math.floor(baseStats.health * rarityMultiplier * classMultiplier.health_multiplier),
    magic: Math.floor(baseStats.magic * rarityMultiplier * classMultiplier.magic_multiplier)
  };
  
  // Сохраняем в кэш
  statsCache.set(cacheKey, result);
  
  return result;
};

export const getRarityDropRates = () => {
  return {
    1: "80%",
    2: "10%",
    3: "5%",
    4: "3%",
    5: "1.5%",
    6: "0.3%",
    7: "0.15%",
    8: "0.05%"
  };
};

const pickRarity = (): Rarity => {
  const weights: Array<{ r: Rarity; w: number }> = [
    { r: 1, w: 8000 }, // 80.00%
    { r: 2, w: 1000 }, // 10.00%
    { r: 3, w: 500 },  // 5.00%
    { r: 4, w: 300 },  // 3.00%
    { r: 5, w: 150 },  // 1.50%
    { r: 6, w: 30 },   // 0.30%
    { r: 7, w: 15 },   // 0.15%
    { r: 8, w: 5 },    // 0.05%
  ];

  const roll = Math.floor(Math.random() * 10000) + 1;
  let cumulative = 0;
  for (const { r, w } of weights) {
    cumulative += w;
    if (roll <= cumulative) return r;
  }
  return 1;
};

const getPetRarityChance = (): Rarity => pickRarity();

const getHeroRarityChance = (): Rarity => pickRarity();

export const getRarityChance = (type: CardType): Rarity => {
  return type === 'pet' ? getPetRarityChance() : getHeroRarityChance();
};

export const generateCard = (type: CardType): Card => {
  const availableCards = cardDatabase.filter(card => card.type === type);
  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  const rarity = getRarityChance(type);
  
  const stats = calculateCardStats(selectedCard.name, rarity, type);
  
  const faction = selectedCard.faction as Faction;
  const magicResistance = faction ? getMagicResistanceByFaction(faction) : undefined;
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: selectedCard.name,
    type,
    rarity,
    faction,
    magicResistance,
    image: selectedCard.image,
    ...stats
  };
};


const isPetActive = (pet: Card, heroes: Card[]): boolean => {
  if (!pet.faction) return false;
  
  return heroes.some(hero => 
    hero.type === 'character' && 
    hero.faction === pet.faction && 
    hero.rarity >= pet.rarity
  );
};

export const calculateTeamStats = (cards: Card[]) => {
  const heroes = cards.filter(card => card.type === 'character');
  const pets = cards.filter(card => card.type === 'pet');
  
  const baseStats = heroes.reduce((acc, hero) => {
    const maxH = hero.health || 0;
    const currH = Math.min(
      typeof (hero as any).currentHealth === 'number' ? (hero as any).currentHealth : maxH,
      maxH
    );
    return {
      power: acc.power + (hero.power || 0),
      defense: acc.defense + (hero.defense || 0),
      health: acc.health + maxH,
      current: acc.current + currH
    };
  }, { power: 0, defense: 0, health: 0, current: 0 });

  const petsBonus = pets.reduce((acc, pet) => {
    if (isPetActive(pet, heroes)) {
      const maxH = pet.health || 0;
      const currH = Math.min(
        typeof (pet as any).currentHealth === 'number' ? (pet as any).currentHealth : maxH,
        maxH
      );
      return {
        power: acc.power + (pet.power || 0),
        defense: acc.defense + (pet.defense || 0),
        health: acc.health + maxH,
        current: acc.current + currH
      };
    }
    return acc;
  }, { power: 0, defense: 0, health: 0, current: 0 });

  const maxHealth = baseStats.health + petsBonus.health;
  const currentHealth = baseStats.current + petsBonus.current;

  const totalMagic = heroes.reduce((acc, hero) => acc + (hero.magic || 0), 0) +
                     pets.reduce((acc, pet) => isPetActive(pet, heroes) ? acc + (pet.magic || 0) : acc, 0);

  return {
    power: baseStats.power + petsBonus.power,
    defense: baseStats.defense + petsBonus.defense,
    health: currentHealth,
    maxHealth,
    mana: totalMagic,
    maxMana: totalMagic
  };
};

export const upgradeCard = (card1: Card, card2: Card): Card | null => {
  if (card1.name !== card2.name || card1.rarity !== card2.rarity || 
      card1.type !== card2.type || card1.faction !== card2.faction) {
    return null;
  }

  if (card1.rarity >= 8) {
    return null;
  }

  const newRarity = (card1.rarity + 1) as Rarity;
  
  const stats = calculateCardStats(card1.name, newRarity, card1.type);

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: card1.name,
    type: card1.type,
    rarity: newRarity,
    faction: card1.faction,
    magicResistance: card1.magicResistance,
    image: card1.image,
    ...stats
  };
};
