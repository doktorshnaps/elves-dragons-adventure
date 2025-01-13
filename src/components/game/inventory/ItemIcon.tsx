import { Item } from "@/components/battle/Inventory";
import { Sparkles, Heart } from "lucide-react";

interface ItemIconProps {
  type: Item["type"];
}

export const ItemIcon = ({ type }: ItemIconProps) => {
  if (type === "cardPack") {
    return <Sparkles className="w-4 h-4" />;
  }
  if (type === "healthPotion") {
    return <Heart className="w-4 h-4 text-red-500" />;
  }
  return null;
};