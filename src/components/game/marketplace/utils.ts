import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";
import { cardDatabase } from "@/data/cardDatabase";

export const getItemDisplayInfo = (item: CardType | Item) => {
  if ("rarity" in item) {
    const card = item as CardType;
    const dbCard = cardDatabase.find((c) => c.name === card.name);
    return {
      rarity: card.rarity,
      type: "Карта",
      description: dbCard?.description || (card.type === "character" ? "Герой" : "Питомец"),
      image: card.image || dbCard?.image,
    };
  }
  return {
    type: "Предмет",
    description: (item as Item).type === "healthPotion" ? "Зелье здоровья" : "Набор карт",
    image: (item as any).image,
  };
};