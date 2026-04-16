import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { t } from '@/utils/translations';
import { translateShopItemName } from '@/utils/shopTranslations';

const HARD_MAX = 50;

interface ShopQuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
  itemName: string;
  pricePerUnit: number;
  availableInShop: number;
  playerBalance: number;
}

export const ShopQuantityModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  pricePerUnit,
  availableInShop,
  playerBalance,
}: ShopQuantityModalProps) => {
  const { language } = useLanguage();

  const maxByBalance = pricePerUnit > 0 ? Math.floor(playerBalance / pricePerUnit) : HARD_MAX;
  const maxQuantity = Math.max(1, Math.min(HARD_MAX, availableInShop, maxByBalance));

  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) setQuantity(1);
  }, [isOpen]);

  const clamp = (n: number) => Math.max(1, Math.min(maxQuantity, n));

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num)) setQuantity(clamp(num));
  };

  const totalCost = quantity * pricePerUnit;
  const canBuy = quantity >= 1 && quantity <= maxQuantity && playerBalance >= totalCost && availableInShop >= quantity;

  const presets = useMemo(() => {
    const all = [1, 5, 10, 25, HARD_MAX];
    return all.filter((v, i) => i === 0 || v <= maxQuantity);
  }, [maxQuantity]);

  const handleConfirm = () => {
    if (!canBuy) return;
    onConfirm(quantity);
    onClose();
  };

  const translatedName = translateShopItemName(language, itemName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md bg-black/90 border-2 border-white backdrop-blur-sm"
        style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-white">
            {t(language, 'shop.buy')} — {translatedName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm text-gray-300 space-y-1">
            <p>
              {t(language, 'shop.price')}{' '}
              <span className="text-white font-medium">{pricePerUnit}</span>{' '}
              {t(language, 'game.currency')} / шт
            </p>
            <p>
              Доступно в магазине:{' '}
              <span className="text-yellow-400 font-medium">{availableInShop}</span>
            </p>
            <p>
              Ваш баланс:{' '}
              <span className="text-yellow-400 font-medium">{playerBalance}</span>{' '}
              {t(language, 'game.currency')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shop-quantity" className="text-white">
              Количество (макс. {maxQuantity}):
            </Label>
            <Input
              id="shop-quantity"
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="bg-black/50 border-2 border-white/30 text-white rounded-3xl"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {presets.map((value) => (
              <Button
                key={value}
                variant="outline"
                size="sm"
                onClick={() => setQuantity(clamp(value))}
                className="flex-1 min-w-[48px] bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
              >
                {value === HARD_MAX ? `${HARD_MAX}` : value}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(maxQuantity)}
              className="flex-1 min-w-[48px] bg-black/50 border-2 border-white/30 text-white hover:bg-white/10 rounded-3xl"
            >
              Макс
            </Button>
          </div>

          <div className="bg-black/50 p-3 rounded-2xl border border-white/20">
            <div className="text-white font-semibold">
              Итого: {totalCost} {t(language, 'game.currency')}
            </div>
            {!canBuy && playerBalance < totalCost && (
              <div className="text-red-400 text-xs mt-1">
                {t(language, 'shop.insufficientFunds')}
              </div>
            )}
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
            disabled={!canBuy}
            className="bg-black/50 border-2 border-white text-white hover:bg-white/10 rounded-3xl disabled:opacity-50"
          >
            {t(language, 'shop.buy')} {quantity} за {totalCost} {t(language, 'game.currency')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
