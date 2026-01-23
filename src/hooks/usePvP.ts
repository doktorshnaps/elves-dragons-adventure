import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGameDataContext } from '@/contexts/GameDataContext';

export interface PvPPair {
  hero: {
    name: string;
    power: number;
    defense: number;
    health: number;
    currentHealth: number;
    currentDefense: number;
    faction?: string;
  };
  dragon?: {
    name: string;
    power: number;
    defense: number;
    health: number;
    currentHealth: number;
    currentDefense: number;
    faction?: string;
  };
  totalPower: number;
  totalDefense: number;
  totalHealth: number;
  currentHealth: number;
  currentDefense: number;
}

export interface PvPMatch {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'cancelled';
  current_turn_wallet: string | null;
  player1_wallet: string;
  player2_wallet: string;
  player1_pairs: PvPPair[];
  player2_pairs: PvPPair[];
  turn_number: number;
  rarity_tier: number;
  entry_fee: number;
  winner_wallet?: string;
  loser_wallet?: string;
  elo_change?: number;
  winner_reward?: number;
  last_action?: any;
  time_remaining?: number;
  is_your_turn?: boolean;
  opponent_wallet?: string;
}

export interface PvPRating {
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  win_streak: number;
  best_win_streak: number;
  matches_played: number;
}

export interface QueueStatus {
  isSearching: boolean;
  queueId?: string;
  searchTime: number;
  status: 'idle' | 'searching' | 'matched' | 'error';
}

export const usePvP = (walletAddress: string | null) => {
  const { toast } = useToast();
  const { gameData } = useGameDataContext();
  
  const [rating, setRating] = useState<PvPRating | null>(null);
  const [activeMatches, setActiveMatches] = useState<PvPMatch[]>([]);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    isSearching: false,
    searchTime: 0,
    status: 'idle'
  });
  const [loading, setLoading] = useState(false);
  
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const matchmakingRef = useRef<NodeJS.Timeout | null>(null);

  // Load player rating
  const loadRating = useCallback(async () => {
    if (!walletAddress) return;
    
    const { data, error } = await supabase.rpc('get_or_create_pvp_rating', {
      p_wallet_address: walletAddress
    });
    
    if (!error && data && Array.isArray(data) && data.length > 0) {
      setRating(data[0] as PvPRating);
    }
  }, [walletAddress]);

  // Check if already in queue and restore state
  const checkExistingQueue = useCallback(async () => {
    if (!walletAddress) return;

    const { data, error } = await supabase
      .from('pvp_queue')
      .select('*')
      .eq('wallet_address', walletAddress)
      .eq('status', 'searching')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!error && data) {
      // Restore queue state
      const joinedAt = new Date(data.joined_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - joinedAt) / 1000);

      setQueueStatus({
        isSearching: true,
        queueId: data.id,
        searchTime: elapsedSeconds,
        status: 'searching'
      });

      // Start timer
      searchTimerRef.current = setInterval(() => {
        setQueueStatus(prev => ({
          ...prev,
          searchTime: prev.searchTime + 1
        }));
      }, 1000);

      // Start matchmaking polling
      startMatchmaking(data.id);
    }
  }, [walletAddress]);

  // Load active matches
  const loadActiveMatches = useCallback(async () => {
    if (!walletAddress) return;
    
    const { data, error } = await supabase.rpc('get_active_pvp_matches', {
      p_wallet_address: walletAddress
    });
    
    if (!error && data) {
      // Map the RPC response to our interface
      const matches = (data as any[]).map(m => ({
        id: m.match_id,
        status: 'active' as const,
        current_turn_wallet: m.is_your_turn ? walletAddress : m.opponent_wallet,
        player1_wallet: walletAddress || '',
        player2_wallet: m.opponent_wallet,
        player1_pairs: [],
        player2_pairs: [],
        turn_number: 1,
        rarity_tier: m.rarity_tier,
        entry_fee: 100,
        time_remaining: m.time_remaining,
        is_your_turn: m.is_your_turn,
        opponent_wallet: m.opponent_wallet
      }));
      setActiveMatches(matches);
    }
  }, [walletAddress]);

  // Join matchmaking queue
  const joinQueue = useCallback(async (rarityTier: number, teamSnapshot: any) => {
    if (!walletAddress) {
      toast({ title: "Ошибка", description: "Кошелек не подключен", variant: "destructive" });
      return false;
    }

    setLoading(true);
    
    const { data, error } = await supabase.rpc('join_pvp_queue', {
      p_wallet_address: walletAddress,
      p_rarity_tier: rarityTier,
      p_team_snapshot: teamSnapshot,
      p_match_type: 'ranked'
    });

    setLoading(false);

    if (error) {
      console.error('Failed to join queue:', error);
      toast({ 
        title: "Ошибка очереди", 
        description: error.message.includes('недостаточно') 
          ? "Недостаточно ELL для входа в PvP" 
          : "Не удалось присоединиться к очереди",
        variant: "destructive" 
      });
      return false;
    }

    const result = data as any;
    
    // Handle "Already in queue" - restore queue state
    if (result?.error === 'Already in queue') {
      toast({ title: "Вы уже в очереди", description: "Поиск противника продолжается..." });
      await checkExistingQueue();
      return true;
    }
    
    if (result?.queue_id) {
      setQueueStatus({
        isSearching: true,
        queueId: result.queue_id,
        searchTime: 0,
        status: 'searching'
      });

      // Start search timer
      searchTimerRef.current = setInterval(() => {
        setQueueStatus(prev => ({
          ...prev,
          searchTime: prev.searchTime + 1
        }));
      }, 1000);

      // Start matchmaking polling
      startMatchmaking(result.queue_id);
      
      toast({ title: "Поиск матча", description: "Ищем достойного противника..." });
      return true;
    }

    return false;
  }, [walletAddress, toast, checkExistingQueue]);

  // Start matchmaking process
  const startMatchmaking = useCallback((queueId: string) => {
    matchmakingRef.current = setInterval(async () => {
      if (!walletAddress) return;
      
      const { data, error } = await supabase.rpc('find_pvp_match', {
        p_wallet_address: walletAddress
      });

      const result = data as any;
      if (result?.match_id) {
        // Match found!
        clearIntervals();
        setQueueStatus({
          isSearching: false,
          searchTime: 0,
          status: 'matched'
        });
        
        toast({ 
          title: "Противник найден!", 
          description: "Матч начинается..." 
        });
        
        // Reload matches
        loadActiveMatches();
      }
    }, 3000); // Poll every 3 seconds
  }, [walletAddress, loadActiveMatches, toast]);

  // Leave queue
  const leaveQueue = useCallback(async () => {
    if (!walletAddress || !queueStatus.queueId) return;

    const { error } = await supabase.rpc('leave_pvp_queue', {
      p_wallet_address: walletAddress
    });

    clearIntervals();
    setQueueStatus({
      isSearching: false,
      searchTime: 0,
      status: 'idle'
    });

    if (!error) {
      toast({ title: "Поиск отменен", description: "Вступительный взнос возвращен" });
    }
  }, [walletAddress, queueStatus.queueId, toast]);

  // Submit move
  const submitMove = useCallback(async (
    matchId: string,
    actionType: 'attack' | 'ability' | 'surrender',
    attackerPairIndex?: number,
    targetPairIndex?: number,
    abilityId?: string
  ) => {
    if (!walletAddress) return null;

    setLoading(true);

    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/pvp-submit-move`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          match_id: matchId,
          wallet_address: walletAddress,
          action_type: actionType,
          attacker_pair_index: attackerPairIndex,
          target_pair_index: targetPairIndex,
          ability_id: abilityId
        })
      }
    );

    setLoading(false);

    const result = await response.json();
    
    if (!response.ok) {
      toast({ 
        title: "Ошибка хода", 
        description: result.error || "Не удалось выполнить действие",
        variant: "destructive" 
      });
      return null;
    }

    if (result.match_status === 'completed') {
      toast({
        title: result.winner === walletAddress ? "Победа!" : "Поражение",
        description: result.winner === walletAddress 
          ? `Вы получили ${result.reward || 0} ELL` 
          : "Удачи в следующем бою!"
      });
      loadRating();
    }

    return result;
  }, [walletAddress, toast, loadRating]);

  // Get match status
  const getMatchStatus = useCallback(async (matchId: string) => {
    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/pvp-match-status?match_id=${matchId}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'x-wallet-address': walletAddress || ''
        }
      }
    );

    if (!response.ok) return null;
    return response.json();
  }, [walletAddress]);

  // Get leaderboard
  const getLeaderboard = useCallback(async (limit = 50, offset = 0) => {
    const { data, error } = await supabase.rpc('get_pvp_leaderboard', {
      p_limit: limit,
      p_offset: offset
    });
    
    return error ? [] : (data || []);
  }, []);

  // Get match history
  const getMatchHistory = useCallback(async (limit = 20) => {
    if (!walletAddress) return [];
    
    const { data, error } = await supabase.rpc('get_pvp_match_history', {
      p_wallet_address: walletAddress,
      p_limit: limit
    });
    
    return error ? [] : (data || []);
  }, [walletAddress]);

  // Clear intervals helper
  const clearIntervals = () => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (matchmakingRef.current) {
      clearInterval(matchmakingRef.current);
      matchmakingRef.current = null;
    }
  };

  // Initialize
  useEffect(() => {
    if (walletAddress) {
      loadRating();
      loadActiveMatches();
      checkExistingQueue(); // Check if already in queue on mount
    }
    
    return () => clearIntervals();
  }, [walletAddress, loadRating, loadActiveMatches, checkExistingQueue]);

  // Subscribe to match updates
  useEffect(() => {
    if (!walletAddress) return;

    const channel = supabase
      .channel('pvp-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pvp_matches',
          filter: `player1_wallet=eq.${walletAddress}`
        },
        () => loadActiveMatches()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pvp_matches',
          filter: `player2_wallet=eq.${walletAddress}`
        },
        () => loadActiveMatches()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [walletAddress, loadActiveMatches]);

  return {
    rating,
    activeMatches,
    queueStatus,
    loading,
    balance: gameData?.balance || 0,
    
    // Actions
    joinQueue,
    leaveQueue,
    submitMove,
    getMatchStatus,
    getLeaderboard,
    getMatchHistory,
    
    // Refresh
    refreshRating: loadRating,
    refreshMatches: loadActiveMatches
  };
};
