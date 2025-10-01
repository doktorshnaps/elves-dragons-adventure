import { supabase } from '@/integrations/supabase/client';
import { MarketplaceListing } from '@/components/game/marketplace/types';
import { useMarketplaceOperations } from './useMarketplaceOperations';

interface UseMarketplaceBuyProps {
  balance: number;
  toast: any;
  removeListing: (id: string) => void;
  syncLocalCaches: (userId: string) => Promise<void>;
  updateGameData: any;
  loadGameData: any;
}

/**
 * Hook for handling marketplace purchases
 */
export const useMarketplaceBuy = ({
  balance,
  toast,
  removeListing,
  syncLocalCaches,
  updateGameData,
  loadGameData
}: UseMarketplaceBuyProps) => {
  const { purchaseListing, ensurePurchaseApplied } = useMarketplaceOperations();

  /**
   * Buy a single listing
   */
  const handleBuy = async (listing: MarketplaceListing) => {
    try {
      if (balance < listing.price) {
        toast({
          title: "Недостаточно ELL",
          description: "У вас недостаточно ELL для покупки",
          variant: "destructive",
        });
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      
      if (!userId) {
        toast({ 
          title: 'Требуется вход', 
          description: 'Войдите, чтобы совершить покупку', 
          variant: 'destructive' 
        });
        return;
      }

      if (listing.sellerId === userId) {
        toast({ 
          title: 'Нельзя купить своё объявление', 
          description: 'Вы не можете покупать собственные товары', 
          variant: 'destructive' 
        });
        return;
      }

      const success = await purchaseListing(
        listing.id,
        () => {},
        (error) => {
          toast({ 
            title: 'Ошибка покупки', 
            description: error, 
            variant: 'destructive' 
          });
        }
      );

      if (!success) return;

      // Remove listing locally
      removeListing(listing.id);

      // Sync with database
      await syncLocalCaches(userId);

      // Ensure purchase applied
      await ensurePurchaseApplied(userId, listing, updateGameData);

      toast({
        title: 'Покупка совершена',
        description: `${listing.item.name} добавлен в ваш инвентарь`,
      });
    } catch (e: any) {
      console.error('Buy handler failed:', e);
      toast({ 
        title: 'Ошибка', 
        description: e?.message || 'Не удалось выполнить покупку', 
        variant: 'destructive' 
      });
    }
  };

  /**
   * Buy multiple selected listings
   */
  const handleBuySelected = async (
    selectedIds: Set<string>,
    listings: MarketplaceListing[],
    clearSelection: () => void,
    removeListings: (ids: string[]) => void
  ) => {
    try {
      if (selectedIds.size === 0) {
        toast({ 
          title: 'Не выбрано', 
          description: 'Выберите хотя бы одно объявление', 
          variant: 'destructive' 
        });
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      
      if (!userId) {
        toast({ 
          title: 'Требуется вход', 
          description: 'Войдите, чтобы совершить покупку', 
          variant: 'destructive' 
        });
        return;
      }

      const selected = listings.filter(l => selectedIds.has(l.id));
      const toBuy = selected.filter(l => l.sellerId !== userId);
      
      if (toBuy.length === 0) {
        toast({ 
          title: 'Неверный выбор', 
          description: 'Нельзя покупать собственные объявления', 
          variant: 'destructive' 
        });
        return;
      }

      // Check balance
      const { data: gd0 } = await supabase
        .from('game_data')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      
      const currentBalance: number = (gd0 as any)?.balance ?? balance;
      const totalCost = toBuy.reduce((sum, l) => sum + l.price, 0);
      
      if (currentBalance < totalCost) {
        toast({ 
          title: 'Недостаточно ELL', 
          description: `Нужно ${totalCost}, доступно ${currentBalance}`, 
          variant: 'destructive' 
        });
        return;
      }

      let success = 0;
      let failed = 0;
      const purchasedIds: string[] = [];

      for (const l of toBuy) {
        const result = await purchaseListing(
          l.id,
          () => {},
          (error) => console.warn('Multi-buy error:', l.id, error)
        );

        if (result) {
          success += 1;
          purchasedIds.push(l.id);
        } else {
          failed += 1;
        }
      }

      // Remove purchased listings
      removeListings(purchasedIds);

      // Sync with database
      await syncLocalCaches(userId);

      clearSelection();

      toast({
        title: 'Пакетная покупка завершена',
        description: `Куплено: ${success}. Ошибок: ${failed}.`,
      });
    } catch (e: any) {
      console.error('handleBuySelected failed:', e);
      toast({ 
        title: 'Ошибка', 
        description: e?.message || 'Не удалось выполнить пакетную покупку', 
        variant: 'destructive' 
      });
    }
  };

  return {
    handleBuy,
    handleBuySelected
  };
};
