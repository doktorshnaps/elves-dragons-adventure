import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';

export const useDisplayName = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current display name
  const { data: displayName, isLoading } = useQuery({
    queryKey: ['displayName', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data } = await supabase
        .from('profiles_public' as any)
        .select('display_name')
        .eq('wallet_address', accountId)
        .maybeSingle();
      return (data as any)?.display_name || null;
    },
    enabled: !!accountId,
    staleTime: 5 * 60 * 1000,
  });

  // Update display name
  const updateMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!accountId) throw new Error('No wallet connected');
      const { data, error } = await supabase.rpc('upsert_display_name', {
        p_wallet_address: accountId,
        p_display_name: newName,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) throw new Error(result.error);
      return result.display_name;
    },
    onSuccess: (newName) => {
      queryClient.setQueryData(['displayName', accountId], newName);
      queryClient.invalidateQueries({ queryKey: ['displayNames'] });
      queryClient.invalidateQueries({ queryKey: ['my-clan'] });
      toast({ title: 'Имя обновлено', description: `Ваше имя: ${newName}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
    },
  });

  return {
    displayName,
    isLoading,
    updateDisplayName: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
