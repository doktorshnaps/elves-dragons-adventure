import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShopItem } from "./shop/ShopItem";
import { shopItems } from "./shop/types";
import { useBalanceState } from "@/hooks/useBalanceState";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { balance, updateBalance } = useBalanceState();

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-game-surface border-game-accent max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-bold text-game-accent">Магический магазин</DialogTitle>
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold text-yellow-400">{balance} монет</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopItems.map((item) => (
              <ShopItem 
                key={item.id} 
                item={item} 
                balance={balance}
                onBuy={() => {
                  if (balance >= item.price) {
                    updateBalance(balance - item.price);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};