import { Card, CardType, Rarity } from "@/types/cards";

const characterNames = [
  "Воин", "Маг", "Лучник", "Жрец", "Паладин",
  "Друид", "Разбойник", "Шаман", "Монах"
];

const petNames = [
  "Волк", "Медведь", "Сова", "Пантера", "Тигр",
  "Орел", "Лев", "Феникс", "Дракончик"
];

const getRarityChance = (): Rarity => {
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

const getStatsForRarity = (rarity: Rarity) => {
  const baseStats = {
    power: Math.floor(Math.random() * 5) + 5,
    defense: Math.floor(Math.random() * 5) + 5
  };
  
  const multiplier = Math.pow(1.5, rarity - 1);
  
  return {
    power: Math.floor(baseStats.power * multiplier),
    defense: Math.floor(baseStats.defense * multiplier)
  };
};

export const generateCard = (type: CardType): Card => {
  const names = type === 'character' ? characterNames : petNames;
  const name = names[Math.floor(Math.random() * names.length)];
  const rarity = getRarityChance();
  const stats = getStatsForRarity(rarity);
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    type,
    rarity,
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
    defense: acc.defense + card.defense
  }), { power: 0, defense: 0 });
};