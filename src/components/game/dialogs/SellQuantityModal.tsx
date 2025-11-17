import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";

interface SellQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  itemName: string;
  maxQuantity: number;
  sellPrice: number;
}

export const SellQuantityModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  maxQuantity,
  sellPrice
}: SellQuantityModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const { language } = useLanguage();

  const handleConfirm = () => {
    if (quantity > 0 && quantity <= maxQuantity) {
      onConfirm(quantity);
      onClose();
      setQuantity(1);
    }
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value) || 0;
    setQuantity(Math.min(Math.max(1, num), maxQuantity));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border-2 border-white backdrop-blur-sm max-w-md">
        <DialogTitle className="text-white text-xl font-bold">
          Продажа предмета
        </DialogTitle>
        <DialogDescription className="text-gray-300">
          Укажите количество предметов "{itemName}" для продажи
        </DialogDescription>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-gray-300">
              Количество (доступно: {maxQuantity})
            </label>
            <Input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="bg-black/50 border-white/30 text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setQuantity(1)}
              className="flex-1"
            >
              1
            </Button>
            <Button
              variant="outline"
              onClick={() => setQuantity(Math.floor(maxQuantity / 2))}
              className="flex-1"
            >
              {Math.floor(maxQuantity / 2)}
            </Button>
            <Button
              variant="outline"
              onClick={() => setQuantity(maxQuantity)}
              className="flex-1"
            >
              Все
            </Button>
          </div>

          <div className="bg-black/50 p-4 rounded-lg border border-white/20">
            <div className="text-white font-semibold">
              Вы получите: {quantity * sellPrice} ELL
            </div>
            <div className="text-gray-400 text-sm">
              {sellPrice} ELL за штуку
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-game-accent hover:bg-game-accent/80"
            >
              Продать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
