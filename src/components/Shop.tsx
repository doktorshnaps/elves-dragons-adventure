import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  type: "healthPotion" | "defensePotion" | "weapon" | "armor";
  value: number;
}

const shopItems: ShopItem[] = [
  {
    id: 1,
    name: "Малое зелье здоровья",
    description: "Восстанавливает 30 очков здоровья",
    price: 50,
    type: "healthPotion",
    value: 30
  },
  {
    id: 2,
    name: "Большое зелье здоровья",
    description: "Восстанавливает 70 очков здоровья",
    price: 100,
    type: "healthPotion",
    value: 70
  },
  {
    id: 3,
    name: "Зелье защиты",
    description: "Увеличивает защиту на 20",
    price: 75,
    type: "defensePotion",
    value: 20
  },
  {
    id: 4,
    name: "Железный меч",
    description: "Увеличивает силу атаки на 15",
    price: 150,
    type: "weapon",
    value: 15
  },
  {
    id: 5,
    name: "Кожаная броня",
    description: "Увеличивает защиту на 10",
    price: 120,
    type: "armor",
    value: 10
  }
];

interface ShopProps {
  onClose: () => void;
  balance: number;
  onBalanceChange: (newBalance: number) => void;
}

export const Shop = ({ onClose, balance, onBalanceChange }: ShopProps) => {
  const { toast } = useToast();
  const [inventory, setInventory] = useState(() => {
    const savedInventory = localStorage.getItem('gameInventory');
    return savedInventory ? JSON.parse(savedInventory) : [];
  });

  const buyItem = (item: ShopItem) => {
    if (balance < item.price) {
      toast({
        title: "Недостаточно токенов",
        description: `Для покупки ${item.name} требуется ${item.price} токенов`,
        variant: "destructive",
      });
      return;
    }

    // Создаем новый предмет с уникальным id
    const newItem = {
      ...item,
      id: Date.now()
    };

    // Получаем текущий инвентарь из localStorage
    const currentInventory = localStorage.getItem('gameInventory');
    const parsedInventory = currentInventory ? JSON.parse(currentInventory) : [];
    
    // Добавляем новый предмет
    const newInventory = [...parsedInventory, newItem];
    
    // Сохраняем обновленный инвентарь
    localStorage.setItem('gameInventory', JSON.stringify(newInventory));
    
    // Обновляем локальное состояние
    setInventory(newInventory);
    
    // Обновляем баланс
    onBalanceChange(balance - item.price);

    // Показываем уведомление об успешной покупке
    toast({
      title: "Покупка успешна!",
      description: `Вы приобрели ${item.name}`,
    });

    // Вызываем событие storage для синхронизации с другими компонентами
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <Card className="bg-game-surface border-game-accent p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
        <Button
          variant="ghost"
          className="absolute right-4 top-4 text-game-accent hover:text-white"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <h2 className="text-2xl font-bold text-game-accent mb-4">Магазин</h2>
        <p className="text-game-accent mb-6">Баланс: {balance} токенов</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shopItems.map((item) => (
            <Card
              key={item.id}
              className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300"
            >
              <h3 className="text-lg font-semibold text-game-accent mb-2">{item.name}</h3>
              <p className="text-gray-400 mb-2">{item.description}</p>
              <p className="text-game-secondary mb-4">Цена: {item.price} токенов</p>
              <Button
                className="w-full bg-game-primary hover:bg-game-primary/80"
                onClick={() => buyItem(item)}
                disabled={balance < item.price}
              >
                Купить
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};