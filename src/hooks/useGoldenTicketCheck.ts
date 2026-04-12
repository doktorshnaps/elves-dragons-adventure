import { useEffect, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

const GOLDEN_TICKET_CONTRACT = 'golden_ticket.nfts.tg';
const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const useGoldenTicketCheck = () => {
  const { accountId, nearAccountId } = useWalletContext();
  const queryClient = useQueryClient();
  const walletCandidates = useMemo(
    () => Array.from(new Set([accountId, nearAccountId].filter(Boolean))) as string[],
    [accountId, nearAccountId]
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Trigger the edge function to refresh NFT access cache
  const refreshAccess = useCallback(async () => {
    if (isRefreshing || walletCandidates.length === 0) return;
    setIsRefreshing(true);
    try {
      for (const wallet of walletCandidates) {
        console.log('🔄 [GoldenTicket] Refreshing access for:', wallet);
        await supabase.functions.invoke('refresh-wallet-whitelist-access', {
          body: { wallet_address: wallet },
        });
      }
      queryClient.invalidateQueries({ queryKey: ['goldenTicketAccess'] });
    } catch (err) {
      console.error('❌ [GoldenTicket] refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [walletCandidates, queryClient, isRefreshing]);

  // Main query: read from wallet_whitelist_nft_access table
  const { data, isLoading } = useQuery({
    queryKey: ['goldenTicketAccess', walletCandidates],
    queryFn: async () => {
      if (walletCandidates.length === 0) return { hasAccess: false, isStale: true, lastVerifiedAt: null };

      const { data: rows, error } = await supabase
        .from('wallet_whitelist_nft_access')
        .select('has_access, last_verified_at')
        .in('wallet_address', walletCandidates)
        .eq('contract_id', GOLDEN_TICKET_CONTRACT)
        .eq('has_access', true)
        .limit(1);

      if (error) {
        console.error('❌ [GoldenTicket] access table query failed:', error);
        return { hasAccess: false, isStale: true, lastVerifiedAt: null };
      }

      if (rows && rows.length > 0) {
        const lastVerified = new Date(rows[0].last_verified_at).getTime();
        const isStale = Date.now() - lastVerified > STALE_TTL_MS;
        return { hasAccess: true, isStale, lastVerifiedAt: rows[0].last_verified_at };
      }

      // No record with has_access=true — check if any record exists at all
      const { data: anyRows } = await supabase
        .from('wallet_whitelist_nft_access')
        .select('last_verified_at')
        .in('wallet_address', walletCandidates)
        .eq('contract_id', GOLDEN_TICKET_CONTRACT)
        .limit(1);

      if (anyRows && anyRows.length > 0) {
        const lastVerified = new Date(anyRows[0].last_verified_at).getTime();
        const isStale = Date.now() - lastVerified > STALE_TTL_MS;
        return { hasAccess: false, isStale, lastVerifiedAt: anyRows[0].last_verified_at };
      }

      // No record at all — needs refresh
      return { hasAccess: false, isStale: true, lastVerifiedAt: null };
    },
    enabled: walletCandidates.length > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  const hasGoldenTicket = data?.hasAccess ?? false;
  const isChecking = isLoading || isRefreshing;

  // Auto-refresh when data is stale or missing
  useEffect(() => {
    if (!isLoading && data?.isStale && walletCandidates.length > 0 && !isRefreshing) {
      refreshAccess();
    }
  }, [isLoading, data?.isStale, walletCandidates.length]);

  // Realtime subscription on wallet_whitelist_nft_access
  useEffect(() => {
    if (walletCandidates.length === 0) return;

    const channels = walletCandidates.map((wallet) =>
      supabase
        .channel(`nft-access:${wallet}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'wallet_whitelist_nft_access',
            filter: `wallet_address=eq.${wallet}`,
          },
          () => queryClient.invalidateQueries({ queryKey: ['goldenTicketAccess'] })
        )
        .subscribe()
    );

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [queryClient, walletCandidates]);

  return { hasGoldenTicket, isLoading: isChecking, refreshAccess };
};
