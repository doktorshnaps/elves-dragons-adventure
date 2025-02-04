import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShopItem } from "./shop/ShopItem";
import { shopItems } from "./shop/types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInventoryState } from "@/hooks/useInventoryState";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { balance, updateBalance } = useBalanceState();
  const { inventory, updateInventory } = useInventoryState();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBuyItem = (item: ShopItem) => {
    if (balance >= item.price) {
      // Создаем новый предмет для инвентаря
      const newItem = {
        id: uuidv4(),
        name: item.name,
        type: item.type,
        value: item.value,
        description: item.description,
        image: item.image,
        stats: item.stats,
        slot: item.slot,
        equipped: false
      };

      // Обновляем баланс и инвентарь
      updateBalance(balance - item.price);
      updateInventory([...inventory, newItem]);

      // Показываем уведомление об успешной покупке
      toast({
        title: "Покупка успешна",
        description: `Вы приобрели ${item.name}`,
      });
    } else {
      // Показываем уведомление о недостатке средств
      toast({
        title: "Недостаточно средств",
        description: "У вас недостаточно монет для покупки этого предмета",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent 
        className="w-screen h-screen max-w-none m-0 p-6 rounded-none bg-game-surface border-game-accent overflow-y-auto"
        style={{
          backgroundImage: "url('/lovable-uploads/20d88f7a-4f27-4b22-8ebe-e55b87a0c7e3.png')",
          backgroundColor: 'rgba(26, 31, 44, 0.95)',
          backgroundBlendMode: 'multiply',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <DialogTitle className="text-2xl font-bold text-game-accent">Магический магазин</DialogTitle>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="outline" 
              className="bg-game-surface/80 border-game-accent text-game-accent hover:bg-game-surface"
              onClick={() => navigate('/menu')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Вернуться в меню
            </Button>
            <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopItems.map((item) => (
              <ShopItem 
                key={item.id} 
                item={item} 
                balance={balance}
                onBuy={() => handleBuyItem(item)}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};