import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Sword, Potion } from "lucide-react";

export interface Item {
  id: number;
  name: string;
  type: "weapon" | "armor" | "healthPotion" | "defensePotion";
  value: number;
}

interface InventoryProps {
  items: Item[];
  onUseItem: (item: Item) => void;
}

export const Inventory = ({ items, onUseItem }: InventoryProps) => {
  const getItemIcon = (type: Item["type"]) => {
    switch (type) {
      case "weapon":
        return <Sword className="w-4 h-4" />;
      case "armor":
        return <Shield className="w-4 h-4" />;
      case "healthPotion":
      case "defensePotion":
        return <Potion className="w-4 h-4" />;
    }
  };

  const getItemDescription = (item: Item) => {
    switch (item.type) {
      case "weapon":
        return `+${item.value} к силе атаки`;
      case "armor":
        return `+${item.value} к защите`;
      case "healthPotion":
        return `Восстанавливает ${item.value} здоровья`;
      case "defensePotion":
        return `Восстанавливает ${item.value} защиты`;
    }
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold text-game-accent mb-4">Инвентарь</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-4 bg-game-surface border-game-accent">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {getItemIcon(item.type)}
                <h4 className="font-bold text-game-accent">{item.name}</h4>
              </div>
              <p className="text-sm text-gray-400">{getItemDescription(item)}</p>
              <Button 
                onClick={() => onUseItem(item)} 
                variant="outline" 
                className="mt-2"
              >
                Использовать
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};