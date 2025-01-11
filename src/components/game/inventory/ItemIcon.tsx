import { Item } from "@/components/battle/Inventory";
import { Sword, Shield, FlaskConical } from "lucide-react";

interface ItemIconProps {
  type: Item["type"];
}

export const ItemIcon = ({ type }: ItemIconProps) => {
  switch (type) {
    case "weapon":
      return <Sword className="w-4 h-4" />;
    case "armor":
      return <Shield className="w-4 h-4" />;
    case "healthPotion":
    case "defensePotion":
      return <FlaskConical className="w-4 h-4" />;
  }
};