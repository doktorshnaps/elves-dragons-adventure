import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ShopItem } from "./shop/ShopItem";
import { shopItems } from "./shop/types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { balance, updateBalance } = useBalanceState();
  const navigate = useNavigate();

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent 
        className="bg-game-surface border-game-accent max-w-4xl max-h-[90vh] overflow-y-auto"
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