import { Card, CardType, Rarity, Faction, MagicResistance } from "@/types/cards";
import { cardDatabase } from "@/data/cardDatabase";

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

export const getStatsForRarity = (rarity: Rarity) => {
  const multiplier = Math.pow(2, rarity - 1);
  
  return {
    power: Math.floor(5 * multiplier),
    defense: Math.floor(5 * multiplier),
    health: Math.floor(10 * multiplier),
    magic: Math.floor(3 * multiplier)
  };
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
  // Используем целочисленное распределение по базисным пунктам (1 = 0.01%)
  // Итого 10000 = 100.00%
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

  const roll = Math.floor(Math.random() * 10000) + 1; // 1..10000
  let cumulative = 0;
  for (const { r, w } of weights) {
    cumulative += w;
    if (roll <= cumulative) return r;
  }
  return 1; // fallback на самый частый вариант
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
  
  const baseStats = selectedCard.baseStats;
  const multiplier = Math.pow(2, rarity - 1);
  
  const stats = {
    power: Math.floor(baseStats.power * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    health: Math.floor(baseStats.health * multiplier),
    magic: Math.floor(baseStats.magic * multiplier)
  };
  
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

export const generatePack = (packType?: 'heroPack' | 'dragonPack'): Card[] => {
  let type: CardType;
  
  if (packType === 'heroPack') {
    type = 'character';
  } else if (packType === 'dragonPack') {
    type = 'pet';
  } else {
    // Старая логика для совместимости
    type = Math.random() > 0.5 ? 'character' : 'pet';
  }
  
  return [generateCard(type)];
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
  
  // Базовые характеристики от героев (и текущее здоровье)
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

  // Добавляем характеристики только от активных питомцев (и их текущее здоровье)
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

  // Расчет маны для команды (максимальная мана = общая магия)
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
  
  const baseCard = cardDatabase.find(card => 
    card.name === card1.name && 
    card.type === card1.type && 
    card.faction === card1.faction
  );
  
  if (!baseCard) return null;
  
  const multiplier = Math.pow(2, newRarity - 1);
  const stats = {
    power: Math.floor(baseCard.baseStats.power * multiplier),
    defense: Math.floor(baseCard.baseStats.defense * multiplier),
    health: Math.floor(baseCard.baseStats.health * multiplier),
    magic: Math.floor(baseCard.baseStats.magic * multiplier)
  };

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
