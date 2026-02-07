import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWalletContext } from '@/contexts/WalletConnectContext';
import { useToast } from '@/hooks/use-toast';

export interface ClanInfo {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  background_image: string | null;
  header_background: string | null;
  level: number;
  experience: number;
  treasury_ell: number;
  max_members: number;
  join_policy: string;
  leader_wallet: string;
  created_at: string;
}

export interface ClanMember {
  wallet_address: string;
  role: string;
  joined_at: string;
  contributed_ell: number;
  display_name: string | null;
  elo: number;
}

export interface ClanSearchResult {
  id: string;
  name: string;
  description: string | null;
  emblem: string;
  level: number;
  join_policy: string;
  leader_wallet: string;
  leader_name: string | null;
  member_count: number;
  max_members: number;
}

export interface ClanLeaderboardEntry {
  id: string;
  name: string;
  emblem: string | null;
  level: number;
  leader_wallet: string;
  leader_name: string | null;
  member_count: number;
  max_members: number;
  total_elo: number;
}

export interface ClanJoinRequest {
  id: string;
  wallet_address: string;
  message: string | null;
  created_at: string;
  display_name: string | null;
  elo: number;
  account_level: number | null;
}

export const useClan = () => {
  const { accountId } = useWalletContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invalidateClan = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['my-clan'] }),
      queryClient.invalidateQueries({ queryKey: ['clan-leaderboard'] }),
      queryClient.invalidateQueries({ queryKey: ['clan-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['clan-search'] }),
    ]);
    // Ensure my-clan data is fully refetched before continuing
    await queryClient.refetchQueries({ queryKey: ['my-clan'] });
  }, [queryClient]);

  // Get my clan
  const { data: myClanData, isLoading: loadingMyClan } = useQuery({
    queryKey: ['my-clan', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase.rpc('get_my_clan', { p_wallet: accountId });
      if (error) throw error;
      return data as any;
    },
    enabled: !!accountId,
    staleTime: 30_000,
  });

  // Get clan leaderboard
  const { data: leaderboardData, isLoading: loadingLeaderboard } = useQuery({
    queryKey: ['clan-leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_clan_leaderboard');
      if (error) throw error;
      return data as any;
    },
    staleTime: 60_000,
  });

  // Get clan requests
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ['clan-requests', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase.rpc('get_clan_requests', { p_wallet: accountId });
      if (error) throw error;
      return data as any;
    },
    enabled: !!accountId && myClanData?.my_role && ['leader', 'deputy', 'officer'].includes(myClanData.my_role),
    staleTime: 30_000,
  });

  // Create clan
  const createClan = useCallback(async (name: string, description: string, joinPolicy: string) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('create_clan', {
      p_wallet: accountId,
      p_name: name,
      p_description: description || null,
      p_join_policy: joinPolicy,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Клан создан!', description: `Клан "${name}" успешно создан` });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Join clan
  const joinClan = useCallback(async (clanId: string, message?: string) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('join_clan', {
      p_wallet: accountId,
      p_clan_id: clanId,
      p_message: message || null,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    if (result.auto_joined) {
      toast({ title: 'Вы вступили в клан!' });
    } else {
      toast({ title: 'Заявка отправлена', description: 'Ожидайте одобрения от руководства клана' });
    }
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Review request
  const reviewRequest = useCallback(async (requestId: string, accept: boolean) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('review_join_request', {
      p_wallet: accountId,
      p_request_id: requestId,
      p_accept: accept,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: accept ? 'Заявка принята' : 'Заявка отклонена' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Leave clan
  const leaveClan = useCallback(async () => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('leave_clan', { p_wallet: accountId });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Вы покинули клан' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Kick member
  const kickMember = useCallback(async (targetWallet: string) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('kick_member', {
      p_wallet: accountId,
      p_target_wallet: targetWallet,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Участник исключён' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Change role
  const changeRole = useCallback(async (targetWallet: string, newRole: string) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('change_member_role', {
      p_wallet: accountId,
      p_target_wallet: targetWallet,
      p_new_role: newRole,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Роль изменена' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Transfer leadership
  const transferLeadership = useCallback(async (targetWallet: string) => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('transfer_leadership', {
      p_wallet: accountId,
      p_target_wallet: targetWallet,
    });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Лидерство передано' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Disband clan
  const disbandClan = useCallback(async () => {
    if (!accountId) return false;
    const { data, error } = await supabase.rpc('disband_clan', { p_wallet: accountId });
    if (error) throw error;
    const result = data as any;
    if (!result.success) {
      toast({ title: 'Ошибка', description: result.error, variant: 'destructive' });
      return false;
    }
    toast({ title: 'Клан расформирован' });
    await invalidateClan();
    return true;
  }, [accountId, toast, invalidateClan]);

  // Search clans
  const searchClans = useCallback(async (query?: string) => {
    const { data, error } = await supabase.rpc('search_clans', { p_query: query || null });
    if (error) throw error;
    const result = data as any;
    return (result?.clans || []) as ClanSearchResult[];
  }, []);

  const myClan = myClanData?.clan as ClanInfo | null;
  const myMembers = (myClanData?.members || []) as ClanMember[];
  const myRole = myClanData?.my_role as string | null;
  const pendingRequests = myClanData?.pending_requests as number || 0;
  const leaderboard = (leaderboardData?.leaderboard || []) as ClanLeaderboardEntry[];
  const requests = (requestsData?.requests || []) as ClanJoinRequest[];

  return {
    myClan,
    myMembers,
    myRole,
    pendingRequests,
    leaderboard,
    requests,
    loadingMyClan,
    loadingLeaderboard,
    loadingRequests,
    createClan,
    joinClan,
    reviewRequest,
    leaveClan,
    kickMember,
    changeRole,
    transferLeadership,
    disbandClan,
    searchClans,
    invalidateClan,
  };
};
