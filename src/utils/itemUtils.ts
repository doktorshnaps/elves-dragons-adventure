import { Item } from "@/components/battle/Inventory";

export const getItemPrice = (item: Item): number => {
  switch (item.type) {
    case "healthPotion":
      return item.value === 30 ? 50 : 100;
    case "defensePotion":
      return 75;
    case "weapon":
      return 150;
    case "armor":
      return 120;
    default:
      return 0;
  }
};

export const getDefaultItemImage = (item: Item): string | undefined => {
  if (item.type === "healthPotion") {
    if (item.value === 30) {
      return "/lovable-uploads/6693dd2b-2511-4c63-ae03-a1b208a8e7da.png";
    } else if (item.value === 70) {
      return "/lovable-uploads/194bfe08-75f6-4415-8fda-5538a83251c3.png";
    }
  }
  return undefined;
};