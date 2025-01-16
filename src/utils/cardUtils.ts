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
  const baseStats = {
    power: Math.floor(Math.random() * 5) + 5,
    defense: Math.floor(Math.random() * 5) + 5,
    health: Math.floor(Math.random() * 10) + 10,
    magic: Math.floor(Math.random() * 5) + 3
  };
  
  const multiplier = Math.pow(1.5, rarity - 1);
  
  return {
    power: Math.floor(baseStats.power * multiplier),
    defense: Math.floor(baseStats.defense * multiplier),
    health: Math.floor(baseStats.health * multiplier),
    magic: Math.floor(baseStats.magic * multiplier)
  };
};

export const getRarityDropRates = () => {
  return {
    1: "40%",
    2: "25%",
    3: "15%",
    4: "10%",
    5: "5%",
    6: "3%",
    7: "1.5%",
    8: "0.5%"
  };
};

export const getRarityChance = (): Rarity => {
  const rand = Math.random() * 100;
  if (rand < 40) return 1;
  if (rand < 65) return 2;
  if (rand < 80) return 3;
  if (rand < 90) return 4;
  if (rand < 95) return 5;
  if (rand < 98) return 6;
  if (rand < 99.5) return 7;
  return 8;
};

export const generateCard = (type: CardType): Card => {
  const availableCards = cardDatabase.filter(card => card.type === type);
  const selectedCard = availableCards[Math.floor(Math.random() * availableCards.length)];
  
  const rarity = getRarityChance();
  const stats = getStatsForRarity(rarity);
  
  // Определяем фракцию в зависимости от имени карты
  const kaledorHeroes = ["Рекрут", "Страж", "Ветеран", "Маг", "Мастер Целитель", "Защитник"];
  const faction = kaledorHeroes.includes(selectedCard.name) ? 'Каледор' : FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
  const magicResistance = getMagicResistanceByFaction(faction);
  
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

export const generatePack = (): Card[] => {
  const type: CardType = Math.random() > 0.5 ? 'character' : 'pet';
  return [generateCard(type)];
};

export const calculateTeamStats = (cards: Card[]) => {
  return cards.reduce((acc, card) => ({
    power: acc.power + card.power,
    defense: acc.defense + card.defense,
    health: acc.health + card.health
  }), { power: 0, defense: 0, health: 0 });
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
  const stats = getStatsForRarity(newRarity);

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