import { MarketplaceLayout } from "@/components/game/marketplace/components/MarketplaceLayout";
import { MarketplaceHeader } from "@/components/game/marketplace/components/MarketplaceHeader";
import { MarketplaceContent } from "@/components/game/marketplace/components/MarketplaceContent";
import { useEffect, useState } from "react";
import { ListingDialog } from "@/components/game/marketplace/ListingDialog";
import { MarketplaceListing } from "@/components/game/marketplace/types";
import { useBalanceState } from "@/hooks/useBalanceState";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useGameData } from "@/hooks/useGameData";
import { Card as CardType } from "@/types/cards";
import { Item } from "@/types/inventory";


export const Marketplace = () => {
  const [showListingDialog, setShowListingDialog] = useState(false);
  const { balance, updateBalance } = useBalanceState();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { loadGameData, updateGameData } = useGameData();
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
      p_listing_type: listing.type,
      p_item_id: (listing.item as any).id,
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
      });
  
      if (error) {
        console.error('process_marketplace_purchase error:', error);
        toast({ title: 'Ошибка покупки', description: error.message, variant: 'destructive' });
        return;
      }
  
      // Баланс будем синхронизировать из БД после RPC, чтобы избежать рассинхронизации
      // await updateBalance(balance - listing.price); // удалено
  
      // Уберём объявление локально, realtime синхронизирует остальное
      setListings(prev => prev.filter(l => l.id !== listing.id));
  
      // Обновим локальные кэши из БД после успешной покупки
      const { data: gd, error: gdErr } = await supabase
        .from('game_data')
        .select('inventory,cards,balance')
        .eq('user_id', userId)
        .maybeSingle();

      // Хэлпер: убедиться, что покупка отразилась (повторная проверка + безопасный патч)
      const ensureApplied = async (snapshot: any | null) => {
        const purchasedId = (listing.item as any)?.id;
        if (!purchasedId) return;

        if (listing.type === 'card') {
          const cards0 = ((snapshot?.cards as any[]) || []);
          let has = cards0.some((c: any) => c?.id === purchasedId);
          if (!has) {
            await new Promise(r => setTimeout(r, 300));
            const { data: gd2 } = await supabase
              .from('game_data')
              .select('inventory,cards')
              .eq('user_id', userId)
              .maybeSingle();
            const cards1 = ((gd2?.cards as any[]) || []);
            has = cards1.some((c: any) => c?.id === purchasedId);
            if (!has) {
              console.warn('[Marketplace] Card missing after purchase, patching locally', { purchasedId, listingId: listing.id });
              const patched = [...cards1, listing.item as any];
              await updateGameData({ cards: patched });
              localStorage.setItem('gameCards', JSON.stringify(patched));
              window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: patched } }));
            }
          }
        } else {
          const inv0 = ((snapshot?.inventory as any[]) || []);
          let has = inv0.some((it: any) => it?.id === purchasedId);
          if (!has) {
            await new Promise(r => setTimeout(r, 300));
            const { data: gd2 } = await supabase
              .from('game_data')
              .select('inventory,cards')
              .eq('user_id', userId)
              .maybeSingle();
            const inv1 = ((gd2?.inventory as any[]) || []);
            has = inv1.some((it: any) => it?.id === purchasedId);
            if (!has) {
              console.warn('[Marketplace] Item missing after purchase, patching locally', { purchasedId, listingId: listing.id });
              const patched = [...inv1, listing.item as any];
              await updateGameData({ inventory: patched as any });
              localStorage.setItem('gameInventory', JSON.stringify(patched));
              window.dispatchEvent(new CustomEvent('inventoryUpdate', { detail: { inventory: patched } }));
            }
          }
        }
      };

      if (!gdErr && gd) {
        // Sync local caches for stability with polling listeners
        localStorage.setItem('gameInventory', JSON.stringify(gd.inventory || []));
        localStorage.setItem('gameCards', JSON.stringify(gd.cards || []));
        const cardsArr = (gd.cards as any[]) || [];
        const invArr = (gd.inventory as any[]) || [];
        console.log('[Marketplace] Post-purchase refresh', { cardsCount: cardsArr.length, invCount: invArr.length, listingId: listing.id });
        const inventoryEvent = new CustomEvent('inventoryUpdate', { detail: { inventory: gd.inventory || [] } });
        window.dispatchEvent(inventoryEvent);
        const cardsEvent = new CustomEvent('cardsUpdate', { detail: { cards: gd.cards || [] } });
        window.dispatchEvent(cardsEvent);
        // Обновим баланс покупателя по данным БД
        const newBalance = (gd as any).balance;
        if (typeof newBalance === 'number') {
          localStorage.setItem('gameBalance', String(newBalance));
          window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: { balance: newBalance } }));
        }
        await ensureApplied(gd);
        // Force global state reload to eliminate any stale caches
        await loadGameData();
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

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBuySelected = async () => {
    try {
      if (selectedIds.size === 0) {
        toast({ title: 'Не выбрано', description: 'Выберите хотя бы одно объявление', variant: 'destructive' });
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId) {
        toast({ title: 'Требуется вход', description: 'Войдите, чтобы совершить покупку', variant: 'destructive' });
        return;
      }

      const selected = listings.filter(l => selectedIds.has(l.id));
      // Фильтруем свои объявления
      const toBuy = selected.filter(l => l.sellerId !== userId);
      if (toBuy.length === 0) {
        toast({ title: 'Неверный выбор', description: 'Нельзя покупать собственные объявления', variant: 'destructive' });
        return;
      }

      // Проверяем актуальный баланс из БД
      const { data: gd0 } = await supabase
        .from('game_data')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();
      const currentBalance: number = (gd0 as any)?.balance ?? balance;
      const totalCost = toBuy.reduce((sum, l) => sum + l.price, 0);
      if (currentBalance < totalCost) {
        toast({ title: 'Недостаточно ELL', description: `Нужно ${totalCost}, доступно ${currentBalance}`, variant: 'destructive' });
        return;
      }

      let success = 0;
      let failed = 0;

      for (const l of toBuy) {
        const { error } = await (supabase as any).rpc('process_marketplace_purchase', { listing_id: l.id });
        if (error) {
          console.warn('Multi-buy error:', l.id, error);
          failed += 1;
          continue;
        }
        success += 1;
        // Локально убираем купленное объявление
        setListings(prev => prev.filter(x => x.id !== l.id));
      }

      // Обновим локальные кэши из БД
      const { data: gd } = await supabase
        .from('game_data')
        .select('inventory,cards,balance')
        .eq('user_id', userId)
        .maybeSingle();
      if (gd) {
        localStorage.setItem('gameInventory', JSON.stringify((gd as any).inventory || []));
        localStorage.setItem('gameCards', JSON.stringify((gd as any).cards || []));
        const newBalance = (gd as any).balance;
        if (typeof newBalance === 'number') {
          localStorage.setItem('gameBalance', String(newBalance));
          window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: { balance: newBalance } }));
        }
        window.dispatchEvent(new CustomEvent('inventoryUpdate', { detail: { inventory: (gd as any).inventory || [] } }));
        window.dispatchEvent(new CustomEvent('cardsUpdate', { detail: { cards: (gd as any).cards || [] } }));
        await loadGameData();
      }

      setSelectedIds(new Set());

      toast({
        title: 'Пакетная покупка завершена',
        description: `Куплено: ${success}. Ошибок: ${failed}.`,
      });
    } catch (e: any) {
      console.error('handleBuySelected failed:', e);
      toast({ title: 'Ошибка', description: e?.message || 'Не удалось выполнить пакетную покупку', variant: 'destructive' });
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
        enableSelection={true}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onBuySelected={handleBuySelected}
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