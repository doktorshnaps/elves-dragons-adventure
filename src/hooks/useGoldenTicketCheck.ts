import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';

const GOLDEN_TICKET_CONTRACT = 'golden_ticket.nfts.tg';

export const useGoldenTicketCheck = () => {
  const { accountId } = useWalletContext();

  const { data: hasGoldenTicket = false, isLoading } = useQuery({
    queryKey: ['goldenTicketCheck', accountId],
    queryFn: async () => {
      if (!accountId) return false;
      const { data, error } = await supabase
        .from('user_nft_cards')
        .select('id')
        .eq('wallet_address', accountId)
        .eq('nft_contract_id', GOLDEN_TICKET_CONTRACT)
        .limit(1);

      if (error) {
        console.error('❌ [GoldenTicket] Check failed:', error);
        return false;
      }
      return (data?.length ?? 0) > 0;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { hasGoldenTicket, isLoading };
};
