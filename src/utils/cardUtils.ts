import { Card, CardType } from "@/types/cards";

const characterNames = [
  "Воин", "Маг", "Лучник", "Жрец", "Паладин",
  "Друид", "Разбойник", "Шаман", "Монах"
];

const petNames = [
  "Волк", "Медведь", "Сова", "Пантера", "Тигр",
  "Орел", "Лев", "Феникс", "Дракончик"
];

export const generateCard = (type: CardType): Card => {
  const names = type === 'character' ? characterNames : petNames;
  const name = names[Math.floor(Math.random() * names.length)];
  
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name,
    type,
    power: Math.floor(Math.random() * 15) + 5, // 5-20
    defense: Math.floor(Math.random() * 10) + 5, // 5-15
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