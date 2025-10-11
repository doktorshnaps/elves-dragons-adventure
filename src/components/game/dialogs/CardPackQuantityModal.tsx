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
      <DialogContent className="sm:max-w-md bg-game-surface border-game-accent">
        <DialogHeader>
          <DialogTitle className="text-game-accent">Открыть колоды карт</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground">
            {item?.name && (
              <p>Колода: <span className="text-foreground font-medium">{item.name}</span></p>
            )}
            <p>Доступно колод: <span className="text-game-accent font-medium">{availableCount}</span></p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-foreground">
              Количество колод для открытия:
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={availableCount}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="bg-background border-game-accent text-foreground"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(1)}
              className="flex-1"
            >
              1
            </Button>
            {availableCount >= 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(5)}
                className="flex-1"
              >
                5
              </Button>
            )}
            {availableCount >= 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(10)}
                className="flex-1"
              >
                10
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(availableCount)}
              className="flex-1"
            >
              Все
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleConfirm} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Открыть {quantity} колод{quantity > 1 ? (quantity > 4 ? '' : 'ы') : 'у'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};