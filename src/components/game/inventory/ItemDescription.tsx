import { GroupedItem } from "./types";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface ItemDescriptionProps {
  item: GroupedItem;
}

export const ItemDescription = ({ item }: ItemDescriptionProps) => {
  const { language } = useLanguage();
  
  if (item.type === "cardPack") {
    return <p className="text-sm text-gray-400 mb-2">{t(language, 'items.cardPackDescriptionValue', { value: String(item.value) })}</p>;
  }
  if (item.type === "healthPotion") {
    return <p className="text-sm text-gray-400 mb-2">{t(language, 'items.healthPotionDescription', { value: String(item.value) })}</p>;
  }
  return null;
};