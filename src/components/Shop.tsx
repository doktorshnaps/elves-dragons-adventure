import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { shopItems } from "@/data/shopItems";
import { useGameData } from "@/hooks/useGameData";
import { useToast } from "@/hooks/use-toast";
import { useShopInventory } from "@/hooks/useShopInventory";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useLanguage } from "@/hooks/useLanguage";
import { t } from "@/utils/translations";
import { translateShopItemName, translateShopItemDescription } from "@/utils/shopTranslations";
import { v4 as uuidv4 } from 'uuid';
import { generateCard } from "@/utils/cardUtils";
import { Item } from "@/types/inventory";
import { ArrowLeft, Clock, Package } from "lucide-react";
import { useState } from "react";
import { PurchaseEffect } from "./shop/PurchaseEffect";
import { supabase } from "@/integrations/supabase/client";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { gameData, loading: gameDataLoading, loadGameData } = useGameData();
  const { accountId } = useWalletContext();
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
  
  const [purchasing, setPurchasing] = useState(false);

  // Force reload game data when shop opens to ensure fresh balance
  useState(() => {
    if (accountId && loadGameData) {
      console.log('🛒 Shop opened, reloading game data for:', accountId);
      loadGameData(accountId);
    }
  });

  if (gameDataLoading || inventoryLoading) {
    return <div className="flex justify-center items-center h-64">{t(language, 'shop.loading')}</div>;
  }

  console.log('🛒 Shop render - balance:', gameData.balance, 'accountId:', accountId);

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

    // Check if user has enough balance before purchase
    if (gameData.balance < item.price) {
      toast({
        title: t(language, 'shop.insufficientFunds'),
        description: t(language, 'shop.insufficientFundsDescription'),
        variant: "destructive",
      });
      return;
    }

    if (purchasing) return;

    try {
      setPurchasing(true);
      console.log(`🛒 Purchasing item: ${item.name} for ${item.price} ELL`);
      
      // Используем shop-purchase edge function для всех типов товаров
      await purchaseItem(item.id, accountId, 1);

      console.log('✅ Purchase successful');
      
      // Reload game data to sync with updated balance and inventory
      if (loadGameData) {
        await loadGameData(accountId);
      }

      setShowEffect(true);
      toast({
        title: item.type === 'cardPack' ? t(language, 'shop.cardPackBought') : t(language, 'shop.purchaseSuccess'),
        description: item.type === 'cardPack' ? t(language, 'shop.cardPackDescription') : `${t(language, 'shop.boughtItem')} ${translateShopItemName(language, item.name)}`,
      });
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: t(language, 'shop.purchaseError'),
        description: t(language, 'shop.purchaseErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

return (
    <div className="relative">
      {showEffect && <PurchaseEffect onComplete={() => setShowEffect(false)} />}
      <div className="sticky top-0 z-10 bg-game-background p-4 border-b-2 border-white">
        <div className="flex items-center justify-between">
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
            <span className="text-white font-semibold">{gameData.balance}</span>
            <span className="text-white/70 text-sm">{t(language, 'game.currency')}</span>
          </div>
          
          <div className="flex items-center gap-2 text-white bg-transparent backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-white" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <Clock className="w-4 h-4" />
            <span className="text-sm">{t(language, 'shop.refillIn')} {timeUntilReset}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {shopItems.map((item) => {
          const quantity = getItemQuantity(item.id);
          const available = isItemAvailable(item.id);
          const canAfford = gameData.balance >= item.price;
          const canBuy = available && canAfford;
          
          return (
            <Card key={item.name} variant="menu" className={`p-4 ${!canBuy ? 'opacity-50' : ''}`} style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
              {item.image && (
                <div className="w-full aspect-[4/3] mb-2 rounded-lg overflow-hidden relative bg-gradient-to-br from-gray-800 to-gray-900">
                  <img 
                    src={item.image} 
                    alt={item.name}
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
                  <h3 className="font-semibold text-white">{translateShopItemName(language, item.name)}</h3>
                  <div className="flex items-center gap-1 text-white text-sm">
                    <Package className="w-3 h-3" />
                    <span>{quantity}</span>
                  </div>
                </div>
                <p className="text-white/70 text-sm">{translateShopItemDescription(language, item.description)}</p>
                {item.stats && (
                  <div className="text-white text-sm">
                    {item.stats.power && <p>{t(language, 'shop.power')} +{item.stats.power}</p>}
                    {item.stats.defense && <p>{t(language, 'shop.defense')} +{item.stats.defense}</p>}
                    {item.stats.health && <p>{t(language, 'shop.health')} +{item.stats.health}</p>}
                  </div>
                )}
                {item.requiredLevel && (
                  <p className="text-yellow-400 text-sm">
                    {t(language, 'shop.requiredLevel')} {item.requiredLevel}
                  </p>
                )}
                <p className="text-white/80">{t(language, 'shop.price')} {item.price} {t(language, 'game.currency')}</p>
                <Button
                  type="button"
                  variant="menu"
                  className="w-full disabled:opacity-50"
                  style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
                  onClick={() => handleBuyItem(item)}
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
  );
};