import { GroupedItem } from "./types";

interface ItemDescriptionProps {
  item: GroupedItem;
}

export const ItemDescription = ({ item }: ItemDescriptionProps) => {
  switch (item.type) {
    case "weapon":
      return <p className="text-sm text-gray-400 mb-2">+{item.value} к силе атаки</p>;
    case "armor":
      return <p className="text-sm text-gray-400 mb-2">+{item.value} к защите</p>;
    case "healthPotion":
      return <p className="text-sm text-gray-400 mb-2">Восстанавливает {item.value} здоровья</p>;
    case "defensePotion":
      return <p className="text-sm text-gray-400 mb-2">Восстанавливает {item.value} защиты</p>;
  }
};