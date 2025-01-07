import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sword, Shield, FlaskConical, ShieldHalf } from "lucide-react";
import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";

interface InventoryItemProps {
  item: Item | Equipment;
  readonly?: boolean;
  onUse: () => void;
  onSell: () => void;
}

const getItemIcon = (type: string) => {
  switch (type) {
    case "weapon":
      return <Sword className="w-4 h-4" />;
    case "armor":
      return <ShieldHalf className="w-4 h-4" />;
    case "shield":
      return <Shield className="w-4 h-4" />;
    case "healthPotion":
    case "defensePotion":
      return <FlaskConical className="w-4 h-4" />;
    default:
      return <FlaskConical className="w-4 h-4" />;
  }
};

const getItemDescription = (item: Item | Equipment) => {
  if ('power' in item) return `+${item.power} к силе атаки`;
  if ('defense' in item) return `+${item.defense} к защите`;
  if ('health' in item) return `+${item.health} к здоровью`;
  if ('value' in item) {
    switch (item.type) {
      case "healthPotion":
        return `Восстанавливает ${item.value} здоровья`;
      case "defensePotion":
        return `Восстанавливает ${item.value} защиты`;
      default:
        return "";
    }
  }
  return "";
};

export const InventoryItem = ({ item, readonly = false, onUse, onSell }: InventoryItemProps) => {
  return (
    <Card
      className={`p-4 bg-game-background border-game-accent ${!readonly ? 'hover:border-game-primary cursor-pointer' : ''} transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-2">
        {getItemIcon(item.type)}
        <h3 className="font-semibold text-game-accent">{item.name}</h3>
      </div>
      <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
      {!readonly && (
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUse}
            className="flex-1"
          >
            {'equipped' in item ? 'Экипировать' : 'Использовать'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSell}
            className="flex-1"
          >
            Продать
          </Button>
        </div>
      )}
    </Card>
  );
};