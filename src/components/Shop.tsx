import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { shopItems } from "@/data/shopItems";
import { useBalanceState } from "@/hooks/useBalanceState";
import { useInventoryState } from "@/hooks/useInventoryState";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { Item } from "@/types/inventory";
import { generateCard } from "@/utils/cardUtils";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { balance, setBalance } = useBalanceState();
  const { addItem } = useInventoryState();
  const { toast } = useToast();

  const handleBuyItem = (item: typeof shopItems[0]) => {
    if (balance >= item.price) {
      if (item.type === "cardPack") {
        // Генерируем случайную карту
        const newCard = generateCard(Math.random() > 0.5 ? 'character' : 'pet');
        
        // Сохраняем карту в localStorage
        const savedCards = localStorage.getItem('gameCards');
        const cards = savedCards ? JSON.parse(savedCards) : [];
        cards.push(newCard);
        localStorage.setItem('gameCards', JSON.stringify(cards));

        // Отправляем событие обновления карт
        const cardsEvent = new CustomEvent('cardsUpdate', { 
          detail: { cards }
        });
        window.dispatchEvent(cardsEvent);

        // Обновляем баланс
        const newBalance = balance - item.price;
        setBalance(newBalance);

        toast({
          title: "Карта получена!",
          description: `Вы получили ${newCard.name} (${newCard.type === 'character' ? 'Герой' : 'Питомец'})`,
        });
      } else {
        // Для остальных предметов оставляем существующую логику
        const newItem: Item = {
          id: uuidv4(),
          name: item.name,
          type: item.type,
          value: item.price,
          description: item.description,
          image: item.image,
          stats: item.stats,
          slot: item.slot,
          equipped: false
        };

        addItem(newItem);
        const newBalance = balance - item.price;
        setBalance(newBalance);

        toast({
          title: "Покупка успешна",
          description: `Вы купили ${item.name}`,
        });
      }
    } else {
      toast({
        title: "Недостаточно средств",
        description: "У вас недостаточно токенов для покупки",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {shopItems.map((item) => (
        <Card key={item.name} className="p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300">
          {item.image && (
            <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-semibold text-game-accent">{item.name}</h3>
            <p className="text-gray-400 text-sm">{item.description}</p>
            {item.stats && (
              <div className="text-game-accent text-sm">
                {item.stats.power && <p>Сила: +{item.stats.power}</p>}
                {item.stats.defense && <p>Защита: +{item.stats.defense}</p>}
                {item.stats.health && <p>Здоровье: +{item.stats.health}</p>}
              </div>
            )}
            {item.requiredLevel && (
              <p className="text-yellow-500 text-sm">
                Требуется уровень: {item.requiredLevel}
              </p>
            )}
            <p className="text-game-secondary">Цена: {item.price} токенов</p>
            <Button
              className="w-full bg-game-primary hover:bg-game-primary/80"
              onClick={() => handleBuyItem(item)}
              disabled={balance < item.price}
            >
              Купить
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};