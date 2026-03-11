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
    image?: string;
    rarity?: number;
  };
  dragon?: {
    name: string;
    power: number;
    defense: number;
    health: number;
    currentHealth: number;
    currentDefense: number;
    faction?: string;
    image?: string;
    rarity?: number;
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
  rarity_tier?: number;
}

export interface QueueStatus {
  isSearching: boolean;
  queueId?: string;
  searchTime: number;
  status: 'idle' | 'searching' | 'matched' | 'error';
  rarityTier?: number;
  teamSnapshot?: any;
  matchedMatchId?: string; // ID of the matched match for auto-navigation
}

export interface BotTeamStatus {
  rarity_tier: number;
  is_active: boolean;
}

const BOT_FALLBACK_TIMEOUT = 30; // seconds before falling back to bot

export const usePvP = (walletAddress: string | null, currentRarityTier: number = 1) => {
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
  // Lock to prevent duplicate bot match creation
  const botMatchInProgressRef = useRef(false);
  // Track if initial load has happened to prevent duplicate fetches
  const initialLoadDoneRef = useRef(false);
  // Reliable search time counter (not affected by React state batching)
  const searchTimeCounterRef = useRef(0);

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
    // Reset counters and flags
    searchTimeCounterRef.current = 0;
    botFallbackTriggeredRef.current = false;
    botMatchInProgressRef.current = false;
  }, []);

  // Load player rating for the current rarity tier
  const loadRating = useCallback(async (tierOverride?: number) => {
    if (!walletAddress) return;
    const tier = tierOverride ?? currentRarityTier;
    
    const { data, error } = await supabase.rpc('get_or_create_pvp_rating', {
      p_wallet_address: walletAddress,
      p_rarity_tier: tier,
    });
    
    if (!error && data && Array.isArray(data) && data.length > 0) {
      setRating(data[0] as PvPRating);
    }
  }, [walletAddress, currentRarityTier]);

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

  // Check if bot is enabled for a specific tier (default: true if no record exists)
  const isBotEnabledForTier = useCallback((tier: number): boolean => {
    const status = botTeamStatus.find(s => s.rarity_tier === tier);
    // Default to true if no record exists yet
    return status ? status.is_active : true;
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

  // Try to start bot match - uses rating from state or fetches fresh ELO
  // Returns matchId on success, null on failure
  // Uses double-checking lock pattern to prevent race conditions
  const tryBotMatch = useCallback(async (rarityTier: number, teamSnapshot: any): Promise<string | null> => {
    // First check - fast path without lock
    if (botMatchInProgressRef.current) {
      console.log('[PvP] tryBotMatch: Already in progress (fast check), skipping');
      return null;
    }
    
    // Set lock immediately
    botMatchInProgressRef.current = true;
    console.log('[PvP] tryBotMatch: Lock acquired');
    
    // Second check after acquiring lock to prevent race condition
    // between setting the lock and processing
    await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to let other calls see the lock
    
    if (!walletAddress) {
      console.log('[PvP] tryBotMatch: No wallet address');
      botMatchInProgressRef.current = false;
      return null;
    }
    
    try {
      // Get player ELO - use rating from state or default to 1000
      const playerElo = rating?.elo ?? 1000;
      console.log('[PvP] tryBotMatch: Starting with ELO:', playerElo);
      
      // Find bot opponent
      const { data: botData, error: botError } = await supabase.rpc('find_bot_opponent', {
        p_wallet_address: walletAddress,
        p_rarity_tier: rarityTier,
        p_player_elo: playerElo
      });
      
      console.log('[PvP] tryBotMatch: find_bot_opponent result:', { botData, botError });
      
      const botResult = botData as any;
      if (botError || !botResult?.found) {
        console.log('[PvP] tryBotMatch: No bot found');
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
        return null;
      }
      
      console.log('[PvP] tryBotMatch: Bot found:', botResult.bot_owner_wallet);
      
      // Leave real queue first (this also refunds the entry fee)
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
        p_player_elo: playerElo,
        p_bot_elo: botResult.elo
      });
      
      console.log('[PvP] tryBotMatch: start_bot_match result:', { matchData, matchError });
      
      const matchResult = matchData as any;
      if (matchError || matchResult?.error) {
        console.log('[PvP] tryBotMatch: Failed to start bot match:', matchError || matchResult?.error);
        toast({ 
          title: "Ошибка", 
          description: matchResult?.error || matchError?.message || "Не удалось создать матч с ботом",
          variant: "destructive" 
        });
        return null;
      }
      
      const matchId = matchResult.match_id;
      console.log('[PvP] tryBotMatch: SUCCESS! Match ID:', matchId);
      
      clearIntervals();
      setQueueStatus({
        isSearching: false,
        searchTime: 0,
        status: 'matched',
        matchedMatchId: matchId // Store for auto-navigation
      });
      
      toast({ 
        title: "🤖 Бот-противник найден!", 
        description: "Матч против команды офлайн игрока" 
      });
      
      loadActiveMatches();
      return matchId;
    } finally {
      // Release lock after a small delay to prevent rapid re-triggering
      setTimeout(() => {
        botMatchInProgressRef.current = false;
        console.log('[PvP] tryBotMatch: Lock released');
      }, 1000);
    }
  }, [walletAddress, rating, toast, loadActiveMatches, clearIntervals]);

  // Start matchmaking process
  const startMatchmaking = useCallback((queueId: string, rarityTier?: number, teamSnapshot?: any) => {
    // Prevent duplicate intervals
    if (matchmakingRef.current) {
      console.log('[PvP] Matchmaking already running, skipping');
      return;
    }
    
    botFallbackTriggeredRef.current = false;
    console.log('[PvP] Starting matchmaking for tier:', rarityTier);
    
    matchmakingRef.current = setInterval(async () => {
      if (!walletAddress) return;
      
      // ❗ Skip if bot match already in progress (prevent duplicate calls)
      if (botMatchInProgressRef.current) {
        console.log('[PvP] Matchmaking tick skipped - bot match in progress');
        return;
      }
      
      // Use ref for reliable time reading (not affected by state batching)
      const currentSearchTime = searchTimeCounterRef.current;
      console.log('[PvP] Matchmaking tick, searchTime:', currentSearchTime, 'botTriggered:', botFallbackTriggeredRef.current);
      
      // Check if we should try bot fallback (after 30 seconds)
      if (currentSearchTime >= BOT_FALLBACK_TIMEOUT && !botFallbackTriggeredRef.current) {
        botFallbackTriggeredRef.current = true;
        console.log('[PvP] Bot fallback triggered at', currentSearchTime, 'seconds');
        
        const tier = rarityTier ?? 1;
        const snapshot = teamSnapshot;
        
        if (snapshot) {
          const matchId = await tryBotMatch(tier, snapshot);
          if (matchId) {
            // ❗ IMPORTANT: Clear interval IMMEDIATELY after successful bot match
            // to prevent any further ticks from creating duplicate matches
            if (matchmakingRef.current) {
              clearInterval(matchmakingRef.current);
              matchmakingRef.current = null;
            }
            return;
          }
          // ❗ Do NOT reset botFallbackTriggeredRef here!
          // The lock (botMatchInProgressRef) handles retry prevention
          console.log('[PvP] Bot match returned null (in progress or failed)');
        }
        return;
      }
      
      // Try to find real opponent
      const { data } = await supabase.rpc('find_pvp_match', {
        p_wallet_address: walletAddress
      });

      const result = data as any;
      if (result?.match_id) {
        // Match found!
        console.log('[PvP] Real opponent found! Match:', result.match_id);
        clearIntervals();
        searchTimeCounterRef.current = 0;
        setQueueStatus({
          isSearching: false,
          searchTime: 0,
          status: 'matched',
          matchedMatchId: result.match_id // Store for auto-navigation
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

    const { data, error } = await supabase.rpc('get_my_queue_entry', {
      p_wallet: walletAddress
    });

    const entry = data as any;
    if (!error && entry) {
      const joinedAt = new Date(entry.joined_at).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - joinedAt) / 1000);
      
      const teamSnapshot = entry.team_snapshot;
      const rarityTier = entry.rarity_tier;

      // Initialize ref counter with elapsed time
      searchTimeCounterRef.current = elapsedSeconds;
      
      setQueueStatus({
        isSearching: true,
        queueId: entry.id,
        searchTime: elapsedSeconds,
        status: 'searching',
        rarityTier,
        teamSnapshot
      });

      // Clear any existing timer before creating new one
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
      
      searchTimerRef.current = setInterval(() => {
        searchTimeCounterRef.current += 1;
        setQueueStatus(prev => ({
          ...prev,
          searchTime: searchTimeCounterRef.current
        }));
      }, 1000);

      startMatchmaking(entry.id, rarityTier, teamSnapshot);
    }
  }, [walletAddress, startMatchmaking]);

  // Join matchmaking queue
  const joinQueue = useCallback(async (rarityTier: number, teamSnapshot: any) => {
    if (!walletAddress) {
      toast({ title: "Ошибка", description: "Кошелек не подключен", variant: "destructive" });
      return false;
    }

    setLoading(true);
    
    // Auto-save bot team if not yet saved (default enabled)
    const existingBotStatus = botTeamStatus.find(s => s.rarity_tier === rarityTier);
    if (!existingBotStatus && rating) {
      // Silently enable bot for this tier
      await supabase.rpc('toggle_bot_team_availability', {
        p_wallet_address: walletAddress,
        p_rarity_tier: rarityTier,
        p_team_snapshot: teamSnapshot,
        p_elo: rating.elo,
        p_is_active: true
      });
      loadBotTeamStatus();
    }
    
    console.log('[PvP] Calling join_pvp_queue with:', { walletAddress, rarityTier, teamSnapshot: teamSnapshot?.length });
    
    const { data, error } = await supabase.rpc('join_pvp_queue', {
      p_wallet_address: walletAddress,
      p_rarity_tier: rarityTier,
      p_team_snapshot: teamSnapshot,
      p_match_type: 'ranked'
    });

    console.log('[PvP] join_pvp_queue response:', { data, error });
    setLoading(false);

    if (error) {
      console.error('[PvP] RPC error:', error);
      toast({ 
        title: "Ошибка очереди", 
        description: error.message.includes('недостаточно') || error.message.includes('ELL')
          ? "Недостаточно ELL для входа в PvP" 
          : `Не удалось присоединиться к очереди: ${error.message}`,
        variant: "destructive" 
      });
      return false;
    }

    const result = data as any;
    
    // Handle error response from RPC
    if (result?.error) {
      // Handle balance error
      if (result.error.includes('ELL') || result.error.includes('недостаточен')) {
        toast({ 
          title: "Недостаточно ELL", 
          description: "Для входа в PvP необходимо 100 ELL",
          variant: "destructive" 
        });
        return false;
      }
      
      toast({ 
        title: "Ошибка очереди", 
        description: result.error,
        variant: "destructive" 
      });
      return false;
    }
    
    if (result?.queue_id || result?.success) {
      const queueId = result.queue_id;
      const isAlreadyInQueue = result.already_in_queue === true;
      
      // If already in queue, just restore the UI state without restarting timers
      if (isAlreadyInQueue && matchmakingRef.current) {
        console.log('[PvP] Already in queue and matchmaking running, skipping restart');
        toast({ title: "Вы уже в очереди", description: "Поиск противника продолжается..." });
        return true;
      }
      
      // Reset ref counter
      searchTimeCounterRef.current = 0;
      
      setQueueStatus({
        isSearching: true,
        queueId: queueId,
        searchTime: 0,
        status: 'searching',
        rarityTier,
        teamSnapshot
      });

      // Clear any existing timer before creating new one
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
      
      // Start the search timer - updates both ref and state
      searchTimerRef.current = setInterval(() => {
        searchTimeCounterRef.current += 1;
        setQueueStatus(prev => ({
          ...prev,
          searchTime: searchTimeCounterRef.current
        }));
      }, 1000);

      startMatchmaking(queueId, rarityTier, teamSnapshot);
      
      toast({ 
        title: isAlreadyInQueue ? "Поиск восстановлен" : "Поиск матча", 
        description: "Ищем игрока... (бот через 30 сек)" 
      });
      return true;
    }

    console.error('Unexpected join queue response:', result);
    toast({ 
      title: "Ошибка", 
      description: "Неожиданный ответ сервера",
      variant: "destructive" 
    });
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

  // Create or retrieve a PvP match session token
  const getSessionToken = useCallback(async (matchId: string): Promise<string | null> => {
    if (!walletAddress) return null;
    
    const { data, error } = await supabase.rpc('create_pvp_match_session', {
      p_wallet_address: walletAddress,
      p_match_id: matchId
    });
    
    if (error || !data || data.error) {
      console.error('[PvP] Failed to get session token:', error || data?.error);
      return null;
    }
    
    return data.session_token;
  }, [walletAddress]);

  // Submit move (player or surrender)
  const submitMove = useCallback(async (
    matchId: string,
    actionType: 'attack' | 'ability' | 'surrender' | 'trigger_bot_turn',
    attackerPairIndex?: number,
    targetPairIndex?: number,
    abilityId?: string
  ) => {
    if (!walletAddress) return null;

    setLoading(true);

    // Get session token for this match
    const sessionToken = await getSessionToken(matchId);
    if (!sessionToken) {
      setLoading(false);
      toast({ 
        title: "Ошибка авторизации", 
        description: "Не удалось получить токен сессии",
        variant: "destructive" 
      });
      return null;
    }

    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';

    const response = await fetch(
      `${supabaseUrl}/functions/v1/pvp-submit-move`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          match_id: matchId,
          session_token: sessionToken,
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
      loadActiveMatches();
    }

    return result;
  }, [walletAddress, toast, loadRating, loadActiveMatches, getSessionToken]);

  // Get match status
  const getMatchStatus = useCallback(async (matchId: string) => {
    // Get session token for this match
    const sessionToken = await getSessionToken(matchId);
    if (!sessionToken) return null;

    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/pvp-match-status?match_id=${matchId}&session_token=${sessionToken}`,
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        }
      }
    );

    if (!response.ok) return null;
    return response.json();
  }, [getSessionToken]);

  // Get leaderboard
  const getLeaderboard = useCallback(async (limit = 50, offset = 0) => {
    const { data, error } = await supabase.rpc('get_pvp_leaderboard', {
      p_limit: limit,
      p_offset: offset
    });
    
    return error ? [] : (data || []);
  }, []);

  // Process timeout for a match (called when turn timer expires)
  const processTimeout = useCallback(async (matchId: string) => {
    const supabaseUrl = 'https://oimhwdymghkwxznjarkv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pbWh3ZHltZ2hrd3h6bmphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTMxMjEsImV4cCI6MjA3MDA4OTEyMX0.97FbtgxM3nYtzTQWf8TpKqvxJ7h_pvhpBOd0SYRd05k';

    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/pvp-process-timeout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ match_id: matchId })
        }
      );

      const result = await response.json();
      
      if (result.success) {
        if (result.action === 'skip') {
          toast({
            title: "⏰ Время вышло!",
            description: `Ход пропущен. Предупреждение ${result.warning_count}/2`,
            variant: "destructive"
          });
        } else if (result.action === 'forfeit') {
          toast({
            title: "⏰ Поражение по таймауту",
            description: "2 пропуска хода — автоматическое поражение",
            variant: "destructive"
          });
          loadRating();
          loadActiveMatches();
        }
      }
      
      return result;
    } catch (error) {
      console.error('[PvP] processTimeout error:', error);
      return null;
    }
  }, [toast, loadRating, loadActiveMatches]);

  // Get match history
  const getMatchHistory = useCallback(async (limit = 20) => {
    if (!walletAddress) return [];
    
    const { data, error } = await supabase.rpc('get_pvp_match_history', {
      p_wallet_address: walletAddress,
      p_limit: limit
    });
    
    return error ? [] : (data || []);
  }, [walletAddress]);

  // Initialize - run ONCE when walletAddress changes, not on every callback change
  useEffect(() => {
    // Prevent duplicate initial loads
    if (!walletAddress) {
      initialLoadDoneRef.current = false;
      return;
    }
    
    if (initialLoadDoneRef.current) {
      return;
    }
    
    initialLoadDoneRef.current = true;
    
    // Load all data in parallel once
    loadRating();
    loadActiveMatches();
    loadBotTeamStatus();
    checkExistingQueue();
    
    return () => {
      clearIntervals();
      initialLoadDoneRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  // Reload rating when rarity tier changes
  useEffect(() => {
    if (walletAddress && initialLoadDoneRef.current) {
      loadRating();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRarityTier]);

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
    processTimeout,
    
    // Refresh
    refreshRating: loadRating,
    refreshMatches: loadActiveMatches,
    refreshBotStatus: loadBotTeamStatus
  };
};