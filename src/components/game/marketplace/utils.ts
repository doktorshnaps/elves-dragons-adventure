import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";

export const getItemDisplayInfo = (item: CardType | Item) => {
  if ('rarity' in item) {
    return {
      rarity: item.rarity,
      type: 'Карта',
      description: `${(item as CardType).type === 'character' ? 'Герой' : 'Питомец'}`
    };
  }
  return {
    type: 'Предмет',
    description: item.type === 'healthPotion' ? 'Зелье здоровья' : 'Набор карт'
  };
};