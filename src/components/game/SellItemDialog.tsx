import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Item } from "@/components/battle/Inventory";
import { Equipment } from "@/types/equipment";
import { shopItems } from "@/constants/shopItems";

interface SellItemDialogProps {
  item: Item | Equipment;
  onSell: (item: Item | Equipment, price: number) => void;
  onClose: () => void;
}

export const SellItemDialog = ({ item, onSell, onClose }: SellItemDialogProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);

  const calculateSellPrice = () => {
    const shopItem = shopItems.find(
      si => si.name === item.name && si.type === item.type
    );
    return shopItem ? Math.floor(shopItem.price * 0.5) : 0;
  };

  const handleSell = () => {
    const price = calculateSellPrice();
    if (price > 0) {
      onSell(item, price);
      toast({
        title: "Предмет продан",
        description: `Вы получили ${price} монет`,
      });
    }
    setIsOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Продать предмет</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="mb-4">
            Продать {item.name} за {calculateSellPrice()} монет?
          </p>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleSell}>
              Продать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};