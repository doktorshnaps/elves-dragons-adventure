import { useEffect, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

const GOLDEN_TICKET_CONTRACT = 'golden_ticket.nfts.tg';

export const useGoldenTicketCheck = () => {
  const { accountId, nearAccountId } = useWalletContext();
  const queryClient = useQueryClient();
  const walletCandidates = useMemo(
    () => Array.from(new Set([accountId, nearAccountId].filter(Boolean))) as string[],
    [accountId, nearAccountId]
  );

  // Main query: call edge function which uses service_role and returns results directly
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['goldenTicketAccess', walletCandidates],
    queryFn: async () => {
      if (walletCandidates.length === 0) return { hasAccess: false };

      for (const wallet of walletCandidates) {
        console.log('🔄 [GoldenTicket] Checking access for:', wallet);
        const { data: response, error } = await supabase.functions.invoke('refresh-wallet-whitelist-access', {
          body: { wallet_address: wallet },
        });

        if (error) {
          console.error('❌ [GoldenTicket] edge function error:', error);
          continue;
        }

        // Check if any result has access for the golden ticket contract
        const results = response?.results || [];
        const goldenTicketResult = results.find(
          (r: any) => r.contract_id === GOLDEN_TICKET_CONTRACT && r.has_access === true
        );

        if (goldenTicketResult) {
          console.log('✅ [GoldenTicket] Access confirmed for:', wallet, 'tokens:', goldenTicketResult.token_count);
          return { hasAccess: true };
        }
      }

      console.log('❌ [GoldenTicket] No access found for any wallet');
      return { hasAccess: false };
    },
    enabled: walletCandidates.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - edge function already refreshes from NEAR RPC
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // re-check every 5 min
  });

  const hasGoldenTicket = data?.hasAccess ?? false;

  const refreshAccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return { hasGoldenTicket, isLoading, refreshAccess };
};
