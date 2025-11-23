import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WhitelistEntry {
  id: string;
  wallet_address: string;
  notes: string | null;
  added_at: string;
  is_active: boolean;
  whitelist_source?: string;
}

export const useWhitelistData = () => {
  return useQuery<WhitelistEntry[]>({
    queryKey: ['whitelist'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelist')
        .select('*')
        .eq('is_active', true)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error loading whitelist:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
