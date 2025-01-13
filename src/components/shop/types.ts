export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "cardPack" | "healthPotion";
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
  }
];