interface CardInfo {
  name: string;
  type: 'character' | 'pet';
  description: string;
  baseStats: {
    power: number;
    defense: number;
    health: number;
    magic: number;
  };
}

export const cardDatabase: CardInfo[] = [
  {
    name: "Воин",
    type: "character",
    description: "Опытный боец, специализирующийся на ближнем бою. Обладает высокой силой и защитой.",
    baseStats: {
      power: 8,
      defense: 7,
      health: 15,
      magic: 2
    }
  },
  {
    name: "Маг",
    type: "character",
    description: "Мастер магических искусств. Обладает высокой магической силой, но низкой защитой.",
    baseStats: {
      power: 4,
      defense: 3,
      health: 10,
      magic: 10
    }
  },
  {
    name: "Лучник",
    type: "character",
    description: "Меткий стрелок, специализирующийся на дальнем бое. Сбалансированные характеристики.",
    baseStats: {
      power: 6,
      defense: 4,
      health: 12,
      magic: 4
    }
  },
  {
    name: "Жрец",
    type: "character",
    description: "Целитель и поддержка команды. Высокое здоровье и магия.",
    baseStats: {
      power: 3,
      defense: 5,
      health: 18,
      magic: 8
    }
  },
  {
    name: "Паладин",
    type: "character",
    description: "Святой воин, сочетающий боевые и магические навыки. Высокая защита.",
    baseStats: {
      power: 6,
      defense: 8,
      health: 16,
      magic: 5
    }
  },
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