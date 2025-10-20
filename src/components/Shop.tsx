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
import { useState, useEffect } from "react";
import { PurchaseEffect } from "./shop/PurchaseEffect";
import { supabase } from "@/integrations/supabase/client";

interface ShopProps {
  onClose: () => void;
}

export const Shop = ({ onClose }: ShopProps) => {
  const { gameData, loading: gameDataLoading, loadGameData, updateGameData } = useGameData();
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
  const [localBalance, setLocalBalance] = useState<number | null>(null);
  const [cardPackPrice, setCardPackPrice] = useState<number | null>(null);

  // Load game data when shop opens
  useEffect(() => {
    if (accountId && loadGameData) {
      console.log('🛒 Shop opened, loading game data for:', accountId);
      loadGameData(accountId);
    }
  }, [accountId, loadGameData]);

  // Load dynamic price for Card Pack from item_templates
  useEffect(() => {
    const fetchCardPackPrice = async () => {
      try {
        const { data, error } = await supabase
          .from('item_templates')
          .select('value')
          .eq('item_id', 'card_pack')
          .single();
        if (error) throw error;
        setCardPackPrice((data as any)?.value ?? null);
      } catch (err) {
        console.error('Error loading card pack price:', err);
      }
    };
    fetchCardPackPrice();
  }, []);
  // Use local balance if available, otherwise use gameData balance
  const displayBalance = localBalance !== null ? localBalance : gameData.balance;

  if (gameDataLoading || inventoryLoading) {
    return <div className="flex justify-center items-center h-64">{t(language, 'shop.loading')}</div>;
  }

  console.log('🛒 Shop render - balance:', displayBalance, 'local:', localBalance, 'gameData:', gameData.balance, 'accountId:', accountId);

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
    if (displayBalance < item.price) {
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
      
      // Instantly update local balance for immediate UI feedback
      const newBalance = displayBalance - item.price;
      setLocalBalance(newBalance);
      
      // Purchase item via edge function
      await purchaseItem(item.id, accountId, 1);

      console.log('✅ Purchase successful');
      
      // Update balance in background without reloading full data
      if (updateGameData) {
        updateGameData({ balance: newBalance }).catch(err => {
          console.error('Background balance update failed:', err);
        });
      }

      setShowEffect(true);
      toast({
        title: item.type === 'cardPack' ? t(language, 'shop.cardPackBought') : t(language, 'shop.purchaseSuccess'),
        description: item.type === 'cardPack' ? t(language, 'shop.cardPackDescription') : `${t(language, 'shop.boughtItem')} ${translateShopItemName(language, item.name)}`,
      });
    } catch (error) {
      console.error('Purchase error:', error);
      // Revert local balance on error
      setLocalBalance(null);
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
      <div className="sticky top-0 z-10 bg-game-background p-2 sm:p-4 border-b-2 border-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            variant="menu"
            onClick={onClose}
            className="flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
            style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{t(language, 'shop.backToMenu')}</span>
            <span className="sm:hidden">{t(language, 'shop.backToMenu').split(' ')[0]}</span>
          </Button>
          
          <div className="flex items-center gap-1 sm:gap-2 bg-transparent backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl border-2 border-white w-full sm:w-auto justify-center" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-sm sm:text-base">{displayBalance}</span>
            <span className="text-white/70 text-xs sm:text-sm">{t(language, 'game.currency')}</span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 text-white bg-transparent backdrop-blur-sm px-2 sm:px-4 py-1.5 sm:py-2 rounded-2xl border-2 border-white w-full sm:w-auto justify-center" style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}>
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm whitespace-nowrap">{t(language, 'shop.refillIn')} {timeUntilReset}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
        {shopItems.map((item) => {
          const displayItem = item.type === 'cardPack' && cardPackPrice !== null ? { ...item, price: cardPackPrice } : item;
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
  );
};