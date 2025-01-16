import { CardInfo } from '../types';

export const basePets: CardInfo[] = [
  {
    name: "Волк",
    type: "pet",
    description: "Верный компаньон с высокой атакой и скоростью.",
    baseStats: {
      power: 7,
      defense: 4,
      health: 12,
      magic: 2
    }
  },
  {
    name: "Медведь",
    type: "pet",
    description: "Мощный защитник с высоким здоровьем и защитой.",
    baseStats: {
      power: 8,
      defense: 7,
      health: 15,
      magic: 1
    }
  },
  {
    name: "Сова",
    type: "pet",
    description: "Мудрый питомец с магическими способностями.",
    baseStats: {
      power: 3,
      defense: 3,
      health: 10,
      magic: 8
    }
  },
  {
    name: "Феникс",
    type: "pet",
    description: "Легендарная птица с высокими магическими способностями.",
    baseStats: {
      power: 6,
      defense: 5,
      health: 14,
      magic: 9
    }
  }
];