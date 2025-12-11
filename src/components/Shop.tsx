import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useShopRealtime } from "@/hooks/useShopRealtime";
import { useShopDataComplete } from "@/hooks/useShopDataComplete";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { translateShopItemName, translateShopItemDescription } from "@/utils/shopTranslations";
import { ArrowLeft, Clock, Package } from "lucide-react";
import { useState } from "react";
import { PurchaseEffect } from "./shop/PurchaseEffect";
import { useQueryClient } from "@tanstack/react-query";
import { invalidationPresets } from "@/utils/selectiveInvalidation";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { accountId } = useWalletContext();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  // Phase 4: Single RPC call for all shop data
  const { shopData, isLoading: shopDataLoading, refetch: refetchShopData } = useShopDataComplete(accountId);
  
  // Real-time updates for shop inventory
  const { 
    timeUntilReset, 
    purchaseItem, 
    getItemQuantity, 
    isItemAvailable 
  } = useShopRealtime();
  
  const { toast } = useToast();
  const [showEffect, setShowEffect] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [lastPurchaseTime, setLastPurchaseTime] = useState(0);

  // Extract data from single shop data response
  const displayBalance = shopData?.user_balance ?? 0;
  const shopInventory = shopData?.shop_inventory ?? [];
  const cardPackPrice = shopData?.item_templates?.find(t => t.item_id === 'card_pack')?.value ?? null;

  if (shopDataLoading) {
    return <div className="flex justify-center items-center h-64">{t(language, 'shop.loading')}</div>;
  }

  const handleBuyItem = async (item: { id: number; name: string; price: number; type?: string; image?: string }) => {
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

    if (displayBalance < item.price) {
      toast({
        title: t(language, 'shop.insufficientFunds'),
        description: t(language, 'shop.insufficientFundsDescription'),
        variant: "destructive",
      });
      return;
    }

    if (purchasing) return;
    
    // Debounce: prevent rapid clicks (2 second cooldown)
    const now = Date.now();
    if (now - lastPurchaseTime < 2000) {
      toast({
        title: t(language, 'shop.error'),
        description: 'Подождите немного перед следующей покупкой',
        variant: "destructive",
      });
      return;
    }
    setLastPurchaseTime(now);

    try {
      setPurchasing(true);
      
      // Purchase item via edge function
      const purchaseResult = await purchaseItem(item.id, accountId, 1);
      
      console.log('✅ [Shop] Purchase complete, using optimistic update...');

      // ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ: обновляем кеш напрямую без refetch
      const newBalance = displayBalance - item.price;
      
      // 1. Обновляем shopDataComplete
      queryClient.setQueryData(['shopDataComplete', accountId], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          user_balance: newBalance,
          shop_inventory: oldData.shop_inventory.map((inv: any) =>
            inv.item_id === item.id
              ? { ...inv, available_quantity: inv.available_quantity - 1 }
              : inv
          )
        };
      });

      // 2. Обновляем gameData для синхронизации с меню и инвентарем
      queryClient.setQueryData(['gameData', accountId], (oldData: any) => {
        if (!oldData) return oldData;
        console.log('🔄 [Shop] Updating gameData balance:', { old: oldData.balance, new: newBalance });
        return {
          ...oldData,
          balance: newBalance
        };
      });

      // Добавляем новый предмет в кеш itemInstances (включая колоды карт)
      const template = shopData?.item_templates?.find(t => t.id === item.id);
      queryClient.setQueryData(['itemInstances', accountId], (oldItems: any[] = []) => [
        ...oldItems,
        {
          id: `temp-${Date.now()}`, // Временный ID до синхронизации
          wallet_address: accountId,
          template_id: item.id,
          item_id: template?.item_id,
          name: template?.name,
          type: template?.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);

      // Селективная инвалидация вместо полной
      await invalidationPresets.afterShopPurchase(accountId);
      
      console.log('✅ [Shop] Optimistic update applied successfully');

      setShowEffect(true);
      toast({
        title: item.type === 'cardPack' ? t(language, 'shop.cardPackBought') : t(language, 'shop.purchaseSuccess'),
        description: item.type === 'cardPack' ? t(language, 'shop.cardPackDescription') : `${t(language, 'shop.boughtItem')} ${translateShopItemName(language, item.name)}`,
      });

    } catch (error) {
      console.error('❌ [Shop] Purchase error:', error);
      
      // При ошибке откатываем оптимистичное обновление через refetch
      try {
        await refetchShopData();
      } catch (refetchError) {
        console.error('❌ [Shop] Recovery refetch failed:', refetchError);
      }
      
      toast({
        title: t(language, 'shop.purchaseError'),
        description: error instanceof Error ? error.message : t(language, 'shop.purchaseErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

return (
    <div className="h-screen p-4 bg-shop overflow-hidden">
      {showEffect && <PurchaseEffect onComplete={() => setShowEffect(false)} />}
      
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="menu"
          onClick={onClose}
          className="flex items-center gap-2"
          style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {t(language, 'shop.backToMenu')}
        </Button>
        
        <div className="flex items-center gap-2 bg-transparent backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-white" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">{displayBalance}</span>
          <span className="text-white/70 text-sm">{t(language, 'game.currency')}</span>
        </div>
        
        <div className="flex items-center gap-2 text-white bg-transparent backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-white" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
          <Clock className="w-4 h-4" />
          <span className="text-sm">{t(language, 'shop.refillIn')} {timeUntilReset}</span>
        </div>
      </div>
      
      <div className="bg-black/50 border-2 border-white rounded-3xl backdrop-blur-sm p-4 h-[calc(100vh-140px)] overflow-y-auto" style={{ boxShadow: '0 15px 10px rgba(0, 0, 0, 0.6)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {shopInventory.map((inventoryItem) => {
            const template = inventoryItem.item_template;
            const displayItem = {
              id: inventoryItem.item_id,
              name: template.name,
              price: template.type === 'cardPack' && cardPackPrice !== null ? cardPackPrice : template.value,
              type: template.type,
              image: template.image_url,
              description: template.description,
              stats: template.stats,
              requiredLevel: template.level_requirement
            };
            
            const quantity = getItemQuantity(displayItem.id);
            const available = isItemAvailable(displayItem.id);
            const canAfford = displayBalance >= displayItem.price;
            const canBuy = available && canAfford;
            
            return (
              <Card key={displayItem.name} variant="menu" className={`p-4 ${!canBuy ? 'opacity-50' : ''}`} style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
                {displayItem.image && (
                  <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden relative bg-gradient-to-br from-gray-800 to-gray-900">
                    <img 
                      src={displayItem.image} 
                      alt={displayItem.name}
                      className="w-full h-full object-contain"
                    />
                    {!available && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <span className="text-red-400 font-bold text-sm bg-red-900/80 px-2 py-1 rounded">
                          {t(language, 'shop.soldOut')}
                        </span>
                      </div>
                    )}
                    {available && !canAfford && (
                      <div className="absolute inset-0 bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-yellow-400 font-bold text-sm bg-yellow-900/80 px-2 py-1 rounded">
                          {t(language, 'shop.insufficientFunds')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">{translateShopItemName(language, displayItem.name)}</h3>
                    <div className="flex items-center gap-1 text-white text-sm">
                      <Package className="w-3 h-3" />
                      <span>{quantity}</span>
                    </div>
                  </div>
                  <p className="text-white/70 text-sm">{translateShopItemDescription(language, displayItem.description)}</p>
                  {displayItem.stats && (
                    <div className="text-white text-sm">
                      {displayItem.stats.power && <p>{t(language, 'shop.power')} +{displayItem.stats.power}</p>}
                      {displayItem.stats.defense && <p>{t(language, 'shop.defense')} +{displayItem.stats.defense}</p>}
                      {displayItem.stats.health && <p>{t(language, 'shop.health')} +{displayItem.stats.health}</p>}
                    </div>
                  )}
                  {displayItem.requiredLevel && (
                    <p className="text-yellow-400 text-sm">
                      {t(language, 'shop.requiredLevel')} {displayItem.requiredLevel}
                    </p>
                  )}
                  <p className="text-white/80">{t(language, 'shop.price')} {displayItem.price} {t(language, 'game.currency')}</p>
                  <Button
                    type="button"
                    variant="menu"
                    className="w-full disabled:opacity-50"
                    style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                    onClick={() => handleBuyItem(displayItem)}
                    disabled={!canBuy || purchasing}
                  >
                    {!available ? t(language, 'shop.soldOutButton') : 
                     !canAfford ? t(language, 'shop.insufficientFundsButton') : 
                     t(language, 'shop.buy')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};