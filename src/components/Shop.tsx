import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/components/battle/Inventory";
import { Equipment, EquipmentSlot, EquipmentType } from "@/types/equipment";

interface ShopItem {
  id: number;
  name: string;
  type: "healthPotion" | "defensePotion" | EquipmentType;
  value: number;
  price: number;
}

interface ShopProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

const shopItems: ShopItem[] = [
  { id: 1, name: "Зелье здоровья", type: "healthPotion", value: 30, price: 50 },
  { id: 2, name: "Зелье защиты", type: "defensePotion", value: 20, price: 40 },
  { id: 3, name: "Меч новичка", type: "weapon", value: 15, price: 100 },
  { id: 4, name: "Кожаная броня", type: "armor", value: 10, price: 80 },
  { id: 5, name: "Деревянный щит", type: "shield", value: 8, price: 60 },
  { id: 6, name: "Кольцо силы", type: "ring", value: 5, price: 120 },
  { id: 7, name: "Амулет здоровья", type: "necklace", value: 25, price: 150 },
];

export const Shop = ({ onClose, balance, onBalanceChange }: ShopProps) => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<(Item | Equipment)[]>(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const handlePurchase = (item: ShopItem) => {
    if (balance >= item.price) {
      const newBalance = balance - item.price;
      onBalanceChange(newBalance);

      if (item.type === 'healthPotion' || item.type === 'defensePotion') {
        const newItem: Item = {
          id: Date.now(),
          name: item.name,
          type: item.type,
          value: item.value,
        };
        const newInventory = [...inventory, newItem];
        setInventory(newInventory);
        localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      } else {
        const newItem: Equipment = {
          id: Date.now(),
          name: item.name,
          type: item.type as EquipmentType,
          slot: item.type === 'ring' ? 'ring1' : item.type as EquipmentSlot,
          equipped: false,
          ...(item.type === 'weapon' ? { power: item.value } : {}),
          ...(item.type === 'armor' || item.type === 'shield' ? { defense: item.value } : {}),
          ...(item.type === 'necklace' ? { health: item.value } : {}),
        };
        const newInventory = [...inventory, newItem];
        setInventory(newInventory);
        localStorage.setItem('gameInventory', JSON.stringify(newInventory));
      }

      toast({
        title: "Покупка совершена",
        description: `${item.name} добавлен в инвентарь`,
      });
    } else {
      toast({
        title: "Недостаточно монет",
        description: "У вас недостаточно монет для покупки этого предмета",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-game-surface border-game-accent">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-game-accent mb-4">Магазин</h2>
          <p className="text-gray-400 mb-6">Доступно монет: {balance} 🪙</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shopItems.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-game-accent rounded-lg flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-game-accent">{item.name}</h3>
                  <p className="text-sm text-gray-400">
                    {item.type === "healthPotion" && `Восстанавливает ${item.value} здоровья`}
                    {item.type === "defensePotion" && `Добавляет ${item.value} защиты`}
                    {item.type === "weapon" && `+${item.value} к силе атаки`}
                    {item.type === "armor" && `+${item.value} к защите`}
                    {item.type === "shield" && `+${item.value} к защите`}
                    {item.type === "ring" && `+${item.value} к характеристикам`}
                    {item.type === "necklace" && `+${item.value} к здоровью`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-yellow-500 font-bold">{item.price} 🪙</span>
                  <Button
                    variant="outline"
                    onClick={() => handlePurchase(item)}
                    disabled={balance < item.price}
                    className="text-game-accent border-game-accent hover:bg-game-accent hover:text-white"
                  >
                    Купить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};