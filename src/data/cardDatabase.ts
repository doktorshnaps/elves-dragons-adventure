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
  image?: string;
}

export const cardDatabase: CardInfo[] = [
  {
    name: "Рекрут",
    type: "character",
    description: "Начинающий воин, только познающий основы боевого искусства.",
    baseStats: {
      power: 5,
      defense: 5,
      health: 10,
      magic: 0
    },
    image: "/lovable-uploads/elf-hero.png"
  },
  {
    name: "Страж",
    type: "character",
    description: "Опытный защитник, специализирующийся на обороне.",
    baseStats: {
      power: 6,
      defense: 8,
      health: 12,
      magic: 0
    },
    image: "/lovable-uploads/d29bf397-b84f-4816-b1d9-6b18edb2aac3.png"
  },
  {
    name: "Ветеран",
    type: "character",
    description: "Закаленный в боях воин с отличным балансом атаки и защиты.",
    baseStats: {
      power: 8,
      defense: 7,
      health: 15,
      magic: 2
    },
    image: "/lovable-uploads/a28d8a2a-1aee-4bbe-a3e1-77a8b37dc8ef.png"
  },
  {
    name: "Маг",
    type: "character",
    description: "Могущественный заклинатель, владеющий тайными искусствами.",
    baseStats: {
      power: 4,
      defense: 4,
      health: 10,
      magic: 10
    },
    image: "/lovable-uploads/e920f28f-c878-4ded-b693-8d82bddce69d.png"
  },
  {
    name: "Мастер Целитель",
    type: "character",
    description: "Искусный целитель, способный поддерживать союзников в бою.",
    baseStats: {
      power: 3,
      defense: 5,
      health: 12,
      magic: 9
    },
    image: "/lovable-uploads/6f8d5363-7b2f-4152-b20b-1ac575aab8a5.png"
  },
  {
    name: "Защитник",
    type: "character",
    description: "Специалист по защите, облаченный в тяжелую броню.",
    baseStats: {
      power: 5,
      defense: 10,
      health: 15,
      magic: 0
    },
    image: "/lovable-uploads/c97ff70c-f816-41ed-95d7-6ae47af5dfed.png"
  },
  {
    name: "Ветеран Защитник",
    type: "character",
    description: "Элитный защитник с годами опыта в обороне.",
    baseStats: {
      power: 7,
      defense: 12,
      health: 18,
      magic: 2
    }
  },
  {
    name: "Стратег",
    type: "character",
    description: "Опытный командир, умело сочетающий боевые и тактические навыки.",
    baseStats: {
      power: 6,
      defense: 6,
      health: 14,
      magic: 6
    }
  },
  {
    name: "Верховный Стратег",
    type: "character",
    description: "Легендарный военачальник с выдающимися боевыми и магическими способностями.",
    baseStats: {
      power: 8,
      defense: 8,
      health: 16,
      magic: 8
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
