import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Item } from '@/types/inventory';

interface CardPackQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  item: Item | null;
  availableCount: number;
}

export const CardPackQuantityModal = ({
  isOpen,
  onClose,
  onConfirm,
  item,
  availableCount
}: CardPackQuantityModalProps) => {
  const [quantity, setQuantity] = useState(1);

  const handleConfirm = () => {
    const finalQuantity = Math.max(1, Math.min(availableCount, quantity));
    onConfirm(finalQuantity);
    onClose();
  };

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) {
      setQuantity(Math.max(1, Math.min(availableCount, num)));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black/90 border-2 border-white backdrop-blur-sm" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <DialogHeader>
          <DialogTitle className="text-white">Открыть колоды карт</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-gray-300">
            {item?.name && (
              <p>Колода: <span className="text-white font-medium">{item.name}</span></p>
            )}
            <p>Доступно колод: <span className="text-yellow-400 font-medium">{availableCount}</span></p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-white">
              Количество колод для открытия:
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableCount}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="bg-black/50 border-2 border-white/30 text-white rounded-3xl"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(1)}
              className="flex-1 bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
            >
              1
            </Button>
            {availableCount >= 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(5)}
                className="flex-1 bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
              >
                5
              </Button>
            )}
            {availableCount >= 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(10)}
                className="flex-1 bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
              >
                10
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(availableCount)}
              className="flex-1 bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
            >
              Все
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleConfirm} 
            className="bg-black/50 border-2 border-white text-white hover:bg-white/10 rounded-3xl"
          >
            Открыть {quantity} колод{quantity > 1 ? (quantity > 4 ? '' : 'ы') : 'у'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};