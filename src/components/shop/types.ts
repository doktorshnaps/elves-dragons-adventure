export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "healthPotion" | "defensePotion" | "weapon" | "armor" | "cardPack";
  value: number;
  image?: string;
}

export const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Колода карт",
    description: "Содержит 1 случайную карту героя или питомца",
    price: 1000,
    type: "cardPack",
    value: 1
  },
  {
    id: 2,
    name: "Малое зелье здоровья",
    description: "Восстанавливает 30 очков здоровья",
    price: 50,
    type: "healthPotion",
    value: 30,
    image: "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png"
  },
  {
    id: 3,
    name: "Большое зелье здоровья",
    description: "Восстанавливает 70 очков здоровья",
    price: 100,
    type: "healthPotion",
    value: 70
  },
  {
    id: 4,
    name: "Зелье защиты",
    description: "Увеличивает защиту на 20",
    price: 75,
    type: "defensePotion",
    value: 20
  },
  {
    id: 5,
    name: "Железный меч",
    description: "Увеличивает силу атаки на 15",
    price: 150,
    type: "weapon",
    value: 15
  },
  {
    id: 6,
    name: "Кожаная броня",
    description: "Увеличивает защиту на 10",
    price: 120,
    type: "armor",
    value: 10
  }
];
