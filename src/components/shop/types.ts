export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "cardPack" | "healthPotion" | "defensePotion" | "weapon" | "armor" | "accessory";
  value: number;
  image?: string;
  stats?: {
    power?: number;
    defense?: number;
    health?: number;
  };
  requiredLevel?: number;
  slot?: "head" | "chest" | "hands" | "legs" | "feet" | "neck" | "ring1" | "ring2" | "weapon" | "offhand";
}

export const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Колода карт",
    description: "Содержит 1 случайную карту героя или питомца",
    price: 1,
    type: "cardPack",
    value: 1,
    image: "/lovable-uploads/e523dce0-4cda-4d32-b4e2-ecec40b1eb39.png"
  },
  {
    id: 2,
    name: "Малое зелье здоровья",
    description: "Восстанавливает 50 единиц здоровья",
    price: 100,
    type: "healthPotion",
    value: 50,
    image: "/lovable-uploads/54fc94d0-0050-4f98-99b9-58cec6e45173.png"
  },
  {
    id: 3,
    name: "Большое зелье здоровья",
    description: "Восстанавливает 150 единиц здоровья",
    price: 250,
    type: "healthPotion",
    value: 150,
    image: "/lovable-uploads/bc24efd6-6a0c-45fe-a823-e610ee6540eb.png"
  },
  {
    id: 4,
    name: "Железный меч",
    description: "Базовое оружие для начинающих воинов",
    price: 300,
    type: "weapon",
    value: 1,
    image: "/lovable-uploads/a983c8e3-bb18-4d44-b5bd-19441bf40f8f.png",
    stats: {
      power: 15
    }
  },
  {
    id: 5,
    name: "Кожаная броня",
    description: "Легкая защитная броня",
    price: 250,
    type: "armor",
    value: 1,
    image: "/lovable-uploads/766f77e4-2e9f-443a-99e6-283aa360efd0.png",
    stats: {
      defense: 10,
      health: 25
    },
    slot: "chest"
  },
  {
    id: 6,
    name: "Стальной нагрудник",
    description: "Прочная металлическая броня",
    price: 500,
    type: "armor",
    value: 2,
    image: "/lovable-uploads/2e415280-562c-485d-9dd8-067b743c3864.png",
    stats: {
      defense: 25,
      health: 50
    },
    slot: "chest"
  },
  {
    id: 7,
    name: "Амулет силы",
    description: "Увеличивает силу атаки",
    price: 400,
    type: "accessory",
    value: 1,
    image: "/lovable-uploads/54fc94d0-0050-4f98-99b9-58cec6e45173.png",
    stats: {
      power: 10,
      health: 15
    },
    slot: "neck"
  },
  {
    id: 8,
    name: "Стальной меч",
    description: "Улучшенное оружие для опытных воинов",
    price: 600,
    type: "weapon",
    value: 2,
    image: "/lovable-uploads/a983c8e3-bb18-4d44-b5bd-19441bf40f8f.png",
    stats: {
      power: 30
    }
  },
  // Добавляем новые предметы стража
  {
    id: 9,
    name: "Капелюх Стража",
    description: "Защитный головной убор стражи. Требуется 5 уровень",
    price: 800,
    type: "armor",
    value: 3,
    image: "/lovable-uploads/766f77e4-2e9f-443a-99e6-283aa360efd0.png",
    stats: {
      defense: 5
    },
    requiredLevel: 5,
    slot: "head"
  },
  {
    id: 10,
    name: "Нагрудник Стража",
    description: "Прочный нагрудник стражи. Требуется 5 уровень",
    price: 1200,
    type: "armor",
    value: 3,
    image: "/lovable-uploads/2e415280-562c-485d-9dd8-067b743c3864.png",
    stats: {
      defense: 15
    },
    requiredLevel: 5,
    slot: "chest"
  },
  {
    id: 11,
    name: "Ботинки Стража",
    description: "Укрепленные ботинки стражи. Требуется 5 уровень",
    price: 800,
    type: "armor",
    value: 3,
    image: "/lovable-uploads/766f77e4-2e9f-443a-99e6-283aa360efd0.png",
    stats: {
      defense: 5
    },
    requiredLevel: 5,
    slot: "feet"
  },
  {
    id: 12,
    name: "Поножи Стража",
    description: "Защитные поножи стражи. Требуется 5 уровень",
    price: 1000,
    type: "armor",
    value: 3,
    image: "/lovable-uploads/766f77e4-2e9f-443a-99e6-283aa360efd0.png",
    stats: {
      defense: 10
    },
    requiredLevel: 5,
    slot: "legs"
  }
];