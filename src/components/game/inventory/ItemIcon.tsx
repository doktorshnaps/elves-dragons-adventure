import { Item } from "@/components/battle/Inventory";
import { Sparkles } from "lucide-react";

interface ItemIconProps {
  type: Item["type"];
}

export const ItemIcon = ({ type }: ItemIconProps) => {
  if (type === "cardPack") {
    return <Sparkles className="w-4 h-4" />;
  }
  return null;
};