import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BannedUser {
  id: string;
  banned_wallet_address: string;
  banned_by_wallet_address: string;
  reason: string | null;
  banned_at: string;
  is_active: boolean;
}

export const useBannedUsersData = () => {
  return useQuery<BannedUser[]>({
    queryKey: ['bannedUsers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banned_users')
        .select('*')
        .order('banned_at', { ascending: false });

      if (error) {
        console.error('Error loading banned users:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
