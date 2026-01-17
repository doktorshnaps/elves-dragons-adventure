import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WhitelistContract {
  id: string;
  contract_id: string;
  contract_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_wallet_address: string;
}

export const useWhitelistContractsData = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts = [], isLoading, error, refetch } = useQuery({
    queryKey: ['whitelistContracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whitelist_contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WhitelistContract[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const addContract = useMutation({
    mutationFn: async ({ contractId, contractName, walletAddress }: { 
      contractId: string; 
      contractName: string; 
      walletAddress: string;
    }) => {
      const { data, error } = await supabase.rpc('admin_add_whitelist_contract', {
        p_contract_id: contractId,
        p_contract_name: contractName,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistContracts'] });
      toast({
        title: 'Контракт добавлен',
        description: 'NFT контракт успешно добавлен',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось добавить контракт: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const toggleContractStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('whitelist_contracts')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistContracts'] });
      toast({
        title: 'Статус изменен',
        description: 'Статус контракта успешно обновлен',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось изменить статус: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whitelist_contracts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whitelistContracts'] });
      toast({
        title: 'Контракт удален',
        description: 'NFT контракт успешно удален',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: `Не удалось удалить контракт: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    contracts,
    isLoading,
    error,
    refetch,
    addContract,
    toggleContractStatus,
    deleteContract,
  };
};
