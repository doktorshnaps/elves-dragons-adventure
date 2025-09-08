import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { shopItems } from "@/data/shopItems";
import { useUnifiedGameState } from "@/hooks/useUnifiedGameState";
import { useToast } from "@/hooks/use-toast";
import { useShopInventory } from "@/hooks/useShopInventory";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { v4 as uuidv4 } from 'uuid';
import { generateCard } from "@/utils/cardUtils";
import { Item } from "@/types/inventory";
import { ArrowLeft, Clock, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { PurchaseEffect } from "./shop/PurchaseEffect";
import { supabase } from "@/integrations/supabase/client";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const gameState = useUnifiedGameState();
  const { accountId } = useWallet();
  const { language } = useLanguage();
  const { 
    inventory, 
    loading: inventoryLoading, 
    timeUntilReset, 
    purchaseItem, 
    getItemQuantity, 
    isItemAvailable 
  } = useShopInventory();
  const { toast } = useToast();
  const [showEffect, setShowEffect] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let isMounted = true;

    const fetchBalance = async () => {
      const { data } = await supabase
        .from('game_data')
        .select('balance')
        .eq('wallet_address', accountId)
        .maybeSingle();
      if (isMounted && data?.balance !== undefined) {
        setLiveBalance(Number(data.balance));
      }
    };

    fetchBalance();

    const channel = supabase
      .channel('game-data-balance')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_data', filter: `wallet_address=eq.${accountId}` },
        (payload) => {
          const newBal = (payload.new as any)?.balance;
          if (newBal !== undefined) setLiveBalance(Number(newBal));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [accountId]);
  if (gameState.loading || inventoryLoading) {
    return <div className="flex justify-center items-center h-64">{t(language, 'shop.loading')}</div>;
  }

  const handleBuyItem = async (item: typeof shopItems[0]) => {
    if (!accountId) {
      toast({
        title: t(language, 'shop.error'),
        description: t(language, 'shop.connectWallet'),
        variant: "destructive",
      });
      return;
    }

    if (!isItemAvailable(item.id)) {
      toast({
        title: t(language, 'shop.itemSoldOut'),
        description: t(language, 'shop.itemSoldOutDescription'),
        variant: "destructive",
      });
      return;
    }

    try {
      console.log(`🛒 Purchasing item: ${item.name} for ${item.price} ELL`);
      
      // Теперь уменьшаем количество товара в магазине (сначала проверяем доступность)
      await purchaseItem(item.id, accountId);

      // Формируем предмет, который кладём в инвентарь
      const newItem: Item = item.type === 'cardPack'
        ? {
            id: uuidv4(),
            name: item.name,
            type: item.type,
            value: item.value,
            description: item.description,
            image: item.image
          }
        : {
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

      // Используем атомарное обновление через SQL для избежания race conditions  
      const { data: updatedData, error: updateError } = await supabase.rpc('atomic_inventory_update', {
        p_wallet_address: accountId,
        p_price_deduction: item.price,
        p_new_item: newItem
      });

      if (updateError) {
        console.error('Failed to update game data atomically:', updateError);
        throw updateError;
      }

      console.log(`✅ Item added atomically. Updated data:`, updatedData);

      // Принудительно обновляем локальное состояние
      await gameState.actions.batchUpdate({
        balance: updatedData.balance,
        inventory: updatedData.inventory as unknown as Item[]
      });

      setShowEffect(true);
      toast({
        title: item.type === 'cardPack' ? t(language, 'shop.cardPackBought') : t(language, 'shop.purchaseSuccess'),
        description: item.type === 'cardPack' ? t(language, 'shop.cardPackDescription') : `${t(language, 'shop.boughtItem')} ${item.name}`,
      });
    } catch (error) {
      toast({
        title: t(language, 'shop.purchaseError'),
        description: t(language, 'shop.purchaseErrorDescription'),
        variant: 'destructive',
      });
    }
  };

return (
    <div className="relative">
      {showEffect && <PurchaseEffect onComplete={() => setShowEffect(false)} />}
      <div className="sticky top-0 z-10 bg-game-background p-4 border-b border-game-accent">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2 text-game-accent hover:text-game-primary hover:bg-game-surface"
          >
            <ArrowLeft className="w-4 h-4" />
            {t(language, 'shop.backToMenu')}
          </Button>
          
          <div className="flex items-center gap-2 bg-game-surface px-4 py-2 rounded-lg border border-game-accent">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-game-accent font-semibold">{(liveBalance ?? gameState.balance)}</span>
            <span className="text-game-secondary text-sm">{t(language, 'game.currency')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-game-accent">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{t(language, 'shop.refillIn')} {timeUntilReset}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {shopItems.map((item) => {
          const quantity = getItemQuantity(item.id);
          const available = isItemAvailable(item.id);
          
          return (
            <Card key={item.name} className={`p-4 bg-game-background border-game-accent hover:border-game-primary transition-all duration-300 ${!available ? 'opacity-50' : ''}`}>
              {item.image && (
                <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {!available && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-400 font-bold text-sm bg-red-900/80 px-2 py-1 rounded">
                        {t(language, 'shop.soldOut')}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-game-accent">{item.name}</h3>
                  <div className="flex items-center gap-1 text-game-accent text-sm">
                    <Package className="w-3 h-3" />
                    <span>{quantity}</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm">{item.description}</p>
                {item.stats && (
                  <div className="text-game-accent text-sm">
                    {item.stats.power && <p>{t(language, 'shop.power')} +{item.stats.power}</p>}
                    {item.stats.defense && <p>{t(language, 'shop.defense')} +{item.stats.defense}</p>}
                    {item.stats.health && <p>{t(language, 'shop.health')} +{item.stats.health}</p>}
                  </div>
                )}
                {item.requiredLevel && (
                  <p className="text-yellow-500 text-sm">
                    {t(language, 'shop.requiredLevel')} {item.requiredLevel}
                  </p>
                )}
                <p className="text-game-secondary">{t(language, 'shop.price')} {item.price} {t(language, 'game.currency')}</p>
                <Button
                  type="button"
                  className="w-full bg-game-primary hover:bg-game-primary/80 disabled:opacity-50"
                  onClick={() => handleBuyItem(item)}
                  disabled={!available}
                >
                  {!available ? t(language, 'shop.soldOutButton') : t(language, 'shop.buy')}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};