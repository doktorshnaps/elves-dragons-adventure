import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

const GOLDEN_TICKET_CONTRACT = 'golden_ticket.nfts.tg';

export const useGoldenTicketCheck = () => {
  const { accountId, nearAccountId } = useWalletContext();
  const queryClient = useQueryClient();
  const walletCandidates = Array.from(new Set([accountId, nearAccountId].filter(Boolean))) as string[];

  const { data: hasGoldenTicket = false, isLoading } = useQuery({
    queryKey: ['goldenTicketCheck', walletCandidates],
    queryFn: async () => {
      if (walletCandidates.length === 0) return false;

      const [userNftResult, cardInstancesResult] = await Promise.all([
        supabase
          .from('user_nft_cards')
          .select('id')
          .in('wallet_address', walletCandidates)
          .eq('nft_contract_id', GOLDEN_TICKET_CONTRACT)
          .limit(1),
        supabase
          .from('card_instances')
          .select('id')
          .in('wallet_address', walletCandidates)
          .eq('nft_contract_id', GOLDEN_TICKET_CONTRACT)
          .limit(1),
      ]);

      if (userNftResult.error) {
        console.error('❌ [GoldenTicket] user_nft_cards check failed:', userNftResult.error);
      }

      if (cardInstancesResult.error) {
        console.error('❌ [GoldenTicket] card_instances check failed:', cardInstancesResult.error);
      }

      return ((userNftResult.data?.length ?? 0) > 0) || ((cardInstancesResult.data?.length ?? 0) > 0);
    },
    enabled: walletCandidates.length > 0,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    if (walletCandidates.length === 0) return;

    const channels = walletCandidates.map((wallet) =>
      supabase
        .channel(`golden-ticket-check:${wallet}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_nft_cards',
            filter: `wallet_address=eq.${wallet}`,
          },
          () => queryClient.invalidateQueries({ queryKey: ['goldenTicketCheck'] })
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'card_instances',
            filter: `wallet_address=eq.${wallet}`,
          },
          () => queryClient.invalidateQueries({ queryKey: ['goldenTicketCheck'] })
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [queryClient, walletCandidates]);

  return { hasGoldenTicket, isLoading };
};
