import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WhitelistContract {
  id: string;
  contract_address: string;
  contract_name: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export const useWhitelistContractsData = () => {
  return useQuery<WhitelistContract[]>({
    queryKey: ['whitelistContracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelist_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading whitelist contracts:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
