import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

interface MarketplaceStats {
  type: string;
  total_listings: number;
  active_listings: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  sold_today: number;
}

export const useMarketplaceStats = () => {
  const [stats, setStats] = useState<MarketplaceStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const { accountId } = useWalletContext();

  // Функция для агрегации статистики на клиенте
  const aggregateMarketplaceStats = useCallback((listings: any[]): MarketplaceStats[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const typeGroups = listings.reduce((acc, listing) => {
      if (!acc[listing.type]) {
        acc[listing.type] = [];
      }
      acc[listing.type].push(listing);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(typeGroups).map(([type, items]) => {
      const activeItems = (items as any[]).filter(item => item.status === 'active');
      const soldToday = (items as any[]).filter(item => 
        item.status === 'sold' && 
        item.sold_at && 
        new Date(item.sold_at) >= today
      );
      
      const activePrices = activeItems.map(item => item.price).filter(Boolean);
      
      return {
        type,
        total_listings: (items as any[]).length,
        active_listings: activeItems.length,
        avg_price: activePrices.length > 0 ? activePrices.reduce((a, b) => a + b, 0) / activePrices.length : 0,
        min_price: activePrices.length > 0 ? Math.min(...activePrices) : 0,
        max_price: activePrices.length > 0 ? Math.max(...activePrices) : 0,
        sold_today: soldToday.length
      };
    });
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      
      // Получаем статистику через прямой запрос
      const { data: statsData, error: statsError } = await supabase
        .from('marketplace_listings')
        .select('type, status, price, sold_at');

      if (statsError) throw statsError;

      // Агрегируем данные на клиенте
      const aggregatedStats = aggregateMarketplaceStats(statsData || []);
      setStats(aggregatedStats);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load marketplace stats:', error);
    } finally {
      setLoading(false);
    }
  }, [aggregateMarketplaceStats]);

  const refreshStats = useCallback(async () => {
    try {
      // Просто перезагружаем данные
      await loadStats();
    } catch (error) {
      console.error('Failed to refresh marketplace stats:', error);
    }
  }, [loadStats]);

  // Загружаем статистику при монтировании
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Подписываемся на изменения в marketplace_listings для автоматического обновления
  useEffect(() => {
    const channel = supabase
      .channel('marketplace-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'marketplace_listings'
        },
        () => {
          // Обновляем статистику при изменениях в маркетплейсе
          setTimeout(refreshStats, 1000); // Небольшая задержка для агрегации изменений
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshStats]);

  // Автоматическое обновление каждые 5 минут
  useEffect(() => {
    const interval = setInterval(refreshStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const getStatsByType = useCallback((type: string) => {
    return stats.find(stat => stat.type === type);
  }, [stats]);

  const getTotalStats = useCallback(() => {
    return stats.reduce((acc, stat) => ({
      total_listings: acc.total_listings + stat.total_listings,
      active_listings: acc.active_listings + stat.active_listings,
      sold_today: acc.sold_today + stat.sold_today
    }), {
      total_listings: 0,
      active_listings: 0,
      sold_today: 0
    });
  }, [stats]);

  return {
    stats,
    loading,
    lastRefresh,
    refreshStats,
    getStatsByType,
    getTotalStats
  };
};