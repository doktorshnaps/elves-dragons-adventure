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
  is_bot_match?: boolean;
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
  rarityTier?: number;
  teamSnapshot?: any;
}

export interface BotTeamStatus {
  rarity_tier: number;
  is_active: boolean;
}

const BOT_FALLBACK_TIMEOUT = 30; // seconds before falling back to bot

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
  const [botTeamStatus, setBotTeamStatus] = useState<BotTeamStatus[]>([]);
  
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const matchmakingRef = useRef<NodeJS.Timeout | null>(null);
  const botFallbackTriggeredRef = useRef(false);

  // Clear intervals helper
  const clearIntervals = useCallback(() => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (matchmakingRef.current) {
      clearInterval(matchmakingRef.current);
      matchmakingRef.current = null;
    }
  }, []);

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

  // Load bot team status
  const loadBotTeamStatus = useCallback(async () => {
    if (!walletAddress) return;
    
    const { data, error } = await supabase.rpc('get_bot_team_status', {
      p_wallet_address: walletAddress
    });
    
    if (!error && data) {
      setBotTeamStatus(data as BotTeamStatus[]);
    }
  }, [walletAddress]);

  // Toggle bot team availability
  const toggleBotTeam = useCallback(async (
    rarityTier: number, 
    teamSnapshot: any, 
    isActive: boolean
  ) => {
    if (!walletAddress || !rating) {
      toast({ title: "Ошибка", description: "Кошелек не подключен", variant: "destructive" });
      return false;
    }

    const { data, error } = await supabase.rpc('toggle_bot_team_availability', {
      p_wallet_address: walletAddress,
      p_rarity_tier: rarityTier,
      p_team_snapshot: teamSnapshot,
      p_elo: rating.elo,
      p_is_active: isActive
    });

    if (error) {
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить настройки бота",
        variant: "destructive" 
      });
      return false;
    }

    await loadBotTeamStatus();
    toast({ 
      title: isActive ? "Бот активирован" : "Бот деактивирован", 
      description: isActive 
        ? "Ваша команда может использоваться как противник для других игроков" 
        : "Ваша команда больше не используется как бот"
    });
    return true;
  }, [walletAddress, rating, toast, loadBotTeamStatus]);

  // Check if bot is enabled for a specific tier
  const isBotEnabledForTier = useCallback((tier: number): boolean => {
    return botTeamStatus.some(s => s.rarity_tier === tier && s.is_active);
  }, [botTeamStatus]);

  // Load active matches
  const loadActiveMatches = useCallback(async () => {
    if (!walletAddress) return;
    
    const { data, error } = await supabase.rpc('get_active_pvp_matches', {
      p_wallet_address: walletAddress
    });
    
    if (!error && data) {
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
        opponent_wallet: m.opponent_wallet,
        is_bot_match: m.is_bot_match || false
      }));
      setActiveMatches(matches);
    }
  }, [walletAddress]);

  // Try to start bot match
  const tryBotMatch = useCallback(async (rarityTier: number, teamSnapshot: any) => {
    if (!walletAddress || !rating) return false;
    
    // Find bot opponent
    const { data: botData, error: botError } = await supabase.rpc('find_bot_opponent', {
      p_wallet_address: walletAddress,
      p_rarity_tier: rarityTier,
      p_player_elo: rating.elo
    });
    
    const botResult = botData as any;
    if (botError || !botResult?.found) {
      toast({ 
        title: "Нет противников", 
        description: "Не найдено ни игроков, ни ботов. Попробуйте позже.",
        variant: "destructive" 
      });
      clearIntervals();
      setQueueStatus({
        isSearching: false,
        searchTime: 0,
        status: 'idle'
      });
      return false;
    }
    
    // Leave real queue first
    await supabase.rpc('leave_pvp_queue', {
      p_wallet_address: walletAddress
    });
    
    // Start bot match
    const { data: matchData, error: matchError } = await supabase.rpc('start_bot_match', {
      p_player_wallet: walletAddress,
      p_rarity_tier: rarityTier,
      p_player_team_snapshot: teamSnapshot,
      p_bot_owner_wallet: botResult.bot_owner_wallet,
      p_bot_team_snapshot: botResult.team_snapshot,
      p_player_elo: rating.elo,
      p_bot_elo: botResult.elo
    });
    
    const matchResult = matchData as any;
    if (matchError || matchResult?.error) {
      toast({ 
        title: "Ошибка", 
        description: matchResult?.error || "Не удалось создать матч с ботом",
        variant: "destructive" 
      });
      return false;
    }
    
    clearIntervals();
    setQueueStatus({
      isSearching: false,
      searchTime: 0,
      status: 'matched'
    });
    
    toast({ 
      title: "🤖 Бот-противник найден!", 
      description: "Матч против команды офлайн игрока" 
    });
    
    loadActiveMatches();
    return true;
  }, [walletAddress, rating, toast, loadActiveMatches, clearIntervals]);

  // Start matchmaking process
  const startMatchmaking = useCallback((queueId: string, rarityTier?: number, teamSnapshot?: any) => {
    botFallbackTriggeredRef.current = false;
    
    matchmakingRef.current = setInterval(async () => {
      if (!walletAddress) return;
      
      // Get current search time from state
      let currentSearchTime = 0;
      setQueueStatus(prev => {
        currentSearchTime = prev.searchTime;
        return prev;
      });
      
      // Check if we should try bot fallback
      if (currentSearchTime >= BOT_FALLBACK_TIMEOUT && !botFallbackTriggeredRef.current) {
        botFallbackTriggeredRef.current = true;
        
        // Try bot match
        const tier = rarityTier ?? 1;
        const snapshot = teamSnapshot;
        
        if (snapshot) {
          tryBotMatch(tier, snapshot);
          return;
        }
      }
      
      const { data } = await supabase.rpc('find_pvp_match', {
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
        
        loadActiveMatches();
      }
    }, 3000);
  }, [walletAddress, loadActiveMatches, toast, tryBotMatch, clearIntervals]);

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
      const joinedAt = new Date(data.joined_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - joinedAt) / 1000);
      
      const teamSnapshot = data.team_snapshot;
      const rarityTier = data.rarity_tier;

      setQueueStatus({
        isSearching: true,
        queueId: data.id,
        searchTime: elapsedSeconds,
        status: 'searching',
        rarityTier,
        teamSnapshot
      });

      searchTimerRef.current = setInterval(() => {
        setQueueStatus(prev => ({
          ...prev,
          searchTime: prev.searchTime + 1
        }));
      }, 1000);

      startMatchmaking(data.id, rarityTier, teamSnapshot);
    }
  }, [walletAddress, startMatchmaking]);

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
        status: 'searching',
        rarityTier,
        teamSnapshot
      });

      searchTimerRef.current = setInterval(() => {
        setQueueStatus(prev => ({
          ...prev,
          searchTime: prev.searchTime + 1
        }));
      }, 1000);

      startMatchmaking(result.queue_id, rarityTier, teamSnapshot);
      
      toast({ 
        title: "Поиск матча", 
        description: "Ищем игрока... (бот через 30 сек)" 
      });
      return true;
    }

    return false;
  }, [walletAddress, toast, checkExistingQueue, startMatchmaking]);

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
  }, [walletAddress, queueStatus.queueId, toast, clearIntervals]);

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

  // Initialize
  useEffect(() => {
    if (walletAddress) {
      loadRating();
      loadActiveMatches();
      loadBotTeamStatus();
      checkExistingQueue();
    }
    
    return () => clearIntervals();
  }, [walletAddress, loadRating, loadActiveMatches, loadBotTeamStatus, checkExistingQueue, clearIntervals]);

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
    botTeamStatus,
    
    // Actions
    joinQueue,
    leaveQueue,
    submitMove,
    getMatchStatus,
    getLeaderboard,
    getMatchHistory,
    toggleBotTeam,
    isBotEnabledForTier,
    
    // Refresh
    refreshRating: loadRating,
    refreshMatches: loadActiveMatches,
    refreshBotStatus: loadBotTeamStatus
  };
};