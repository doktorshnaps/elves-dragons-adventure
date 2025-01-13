export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "cardPack";
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
  }
];