import { GroupedItem } from "./types";

interface ItemDescriptionProps {
  item: GroupedItem;
}

export const ItemDescription = ({ item }: ItemDescriptionProps) => {
  if (item.type === "cardPack") {
    return <p className="text-sm text-gray-400 mb-2">Содержит {item.value} случайных карт</p>;
  }
  if (item.type === "healthPotion") {
    return <p className="text-sm text-gray-400 mb-2">Восстанавливает {item.value} единиц здоровья</p>;
  }
  return null;
};