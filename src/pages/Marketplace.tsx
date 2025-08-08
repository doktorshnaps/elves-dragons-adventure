import { MarketplaceLayout } from "@/components/game/marketplace/components/MarketplaceLayout";
import { MarketplaceHeader } from "@/components/game/marketplace/components/MarketplaceHeader";
import { MarketplaceContent } from "@/components/game/marketplace/components/MarketplaceContent";
import { useEffect, useState } from "react";
import { ListingDialog } from "@/components/game/marketplace/ListingDialog";
import { MarketplaceListing } from "@/components/game/marketplace/types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const Marketplace = () => {
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { balance, updateBalance } = useBalanceState();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped: MarketplaceListing[] = data.map((row: any) => ({
          id: row.id,
          type: row.type,
          item: row.item,
          price: row.price,
          sellerId: row.seller_id,
          createdAt: row.created_at,
        }));
        setListings(mapped);
      }
    };
    load();

    const channel = supabase
      .channel('public:marketplace_listings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'marketplace_listings' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'marketplace_listings' }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCreateListing = async (listing: MarketplaceListing) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      toast({ title: 'Требуется вход', description: 'Войдите, чтобы создать объявление', variant: 'destructive' });
      return;
    }
    const { data: listingRes, error: listingErr } = await (supabase as any).rpc('create_marketplace_listing', {
      p_seller_id: userId,
      p_listing_type: listing.type,
      p_item: listing.item as any,
      p_price: listing.price,
    });
    if (listingErr) {
      toast({ title: 'Не удалось создать объявление', description: listingErr.message, variant: 'destructive' });
      return;
    }
    setShowListingDialog(false);
    toast({
      title: "Предмет выставлен на продажу",
      description: `${listing.item.name} выставлен за ${listing.price} ELL`,
    });

    // Обновим локальные состояния из БД
    const { data: userRes2 } = await supabase.auth.getUser();
    const uid = userRes2?.user?.id;
    if (uid) {
      const { data: gd } = await supabase
        .from('game_data')
        .select('inventory,cards')
        .eq('user_id', uid)
        .maybeSingle();
      if (gd) {
        // Sync local cache to avoid stale overwrites from listeners polling localStorage
        localStorage.setItem('gameInventory', JSON.stringify(gd.inventory || []));
        localStorage.setItem('gameCards', JSON.stringify(gd.cards || []));
        const inventoryEvent = new CustomEvent('inventoryUpdate', { detail: { inventory: gd.inventory || [] } });
        window.dispatchEvent(inventoryEvent);
        const cardsEvent = new CustomEvent('cardsUpdate', { detail: { cards: gd.cards || [] } });
        window.dispatchEvent(cardsEvent);
      }
    }
  };

  const handleCancelListing = async (listing: MarketplaceListing) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) {
      toast({ title: 'Требуется вход', description: 'Войдите, чтобы отменить объявление', variant: 'destructive' });
      return;
    }

    const { error } = await (supabase as any).rpc('cancel_marketplace_listing', {
      p_listing_id: listing.id,
      p_requester_id: userId,
    });

    if (error) {
      toast({ title: 'Не удалось отменить объявление', description: error.message, variant: 'destructive' });
      return;
    }

    // Уберём объявление из списка (оно уже не активно)
    const newListings = listings.filter(l => l.id !== listing.id);
    setListings(newListings);

    // Обновим локальные состояния инвентаря и колоды из БД
    const { data: gd } = await supabase
      .from('game_data')
      .select('inventory,cards')
      .eq('user_id', userId)
      .maybeSingle();
    if (gd) {
      // Keep localStorage in sync so UI listeners relying on it stay correct
      localStorage.setItem('gameInventory', JSON.stringify(gd.inventory || []));
      localStorage.setItem('gameCards', JSON.stringify(gd.cards || []));
      const inventoryEvent = new CustomEvent('inventoryUpdate', { detail: { inventory: gd.inventory || [] } });
      window.dispatchEvent(inventoryEvent);
      const cardsEvent = new CustomEvent('cardsUpdate', { detail: { cards: gd.cards || [] } });
      window.dispatchEvent(cardsEvent);
    }

    toast({
      title: 'Объявление отменено',
      description: `${listing.item.name} возвращен(а) в ваш инвентарь/колоду`,
    });
  };

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
        toast({ title: 'Требуется вход', description: 'Войдите, чтобы совершить покупку', variant: 'destructive' });
        return;
      }
      if (listing.sellerId === userId) {
        toast({ title: 'Нельзя купить своё объявление', description: 'Вы не можете покупать собственные товары', variant: 'destructive' });
        return;
      }
  
      // Атомарная покупка на сервере
      const { error } = await (supabase as any).rpc('process_marketplace_purchase', {
        listing_id: listing.id,
        buyer_id: userId,
      });
  
      if (error) {
        console.error('process_marketplace_purchase error:', error);
        toast({ title: 'Ошибка покупки', description: error.message, variant: 'destructive' });
        return;
      }
  
      // Обновим баланс локально
      await updateBalance(balance - listing.price);
  
      // Уберём объявление локально, realtime синхронизирует остальное
      setListings(prev => prev.filter(l => l.id !== listing.id));
  
      // Обновим локальные кэши из БД после успешной покупки
      const { data: gd, error: gdErr } = await supabase
        .from('game_data')
        .select('inventory,cards')
        .eq('user_id', userId)
        .maybeSingle();
      if (!gdErr && gd) {
        // Sync local caches for stability with polling listeners
        localStorage.setItem('gameInventory', JSON.stringify(gd.inventory || []));
        localStorage.setItem('gameCards', JSON.stringify(gd.cards || []));
        const inventoryEvent = new CustomEvent('inventoryUpdate', { detail: { inventory: gd.inventory || [] } });
        window.dispatchEvent(inventoryEvent);
        const cardsEvent = new CustomEvent('cardsUpdate', { detail: { cards: gd.cards || [] } });
        window.dispatchEvent(cardsEvent);
      }
  
      toast({
        title: 'Покупка совершена',
        description: `${listing.item.name} добавлен в ваш инвентарь`,
      });
    } catch (e: any) {
      console.error('Buy handler failed:', e);
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось выполнить покупку', variant: 'destructive' });
    }
  };

  return (
    <MarketplaceLayout>
      <MarketplaceHeader />
      <MarketplaceContent
        listings={listings}
        balance={balance}
        onOpenListingDialog={() => setShowListingDialog(true)}
        onBuy={handleBuy}
        onCancelListing={handleCancelListing}
      />
      {showListingDialog && (
        <ListingDialog
          onClose={() => setShowListingDialog(false)}
          onCreateListing={handleCreateListing}
        />
      )}
    </MarketplaceLayout>
  );
};