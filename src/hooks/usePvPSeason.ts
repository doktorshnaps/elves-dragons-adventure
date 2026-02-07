import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BonusReward {
  type: "hero_card" | "dragon_card" | "item";
  template_id: string;
  name: string;
  rarity?: number;
  quantity: number;
}

export interface LeagueRewardConfig {
  name: string;
  ell_reward: number;
  bonus_rewards?: BonusReward[];
}

export interface PvPSeason {
  id: string;
  season_number: number;
  name: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  rewards_config: Record<string, {
    icon?: string;
    min_elo: number;
    max_elo: number;
    ell_reward: number;
    bonus_card?: string | boolean;
    bonus_rewards?: BonusReward[];
    title?: boolean;
  }>;
  league_rewards_config: Record<string, LeagueRewardConfig>;
  rewards_distributed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeasonLeaderboardEntry {
  rank: number;
  wallet_address: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  matches_played: number;
  win_streak: number;
  best_win_streak: number;
  rarity_tier?: number;
}

export function usePvPSeason() {
  const [countdown, setCountdown] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { data: activeSeason, isLoading: seasonLoading, refetch: refetchSeason } = useQuery({
    queryKey: ["pvp-active-season"],
    queryFn: async (): Promise<PvPSeason | null> => {
      const { data, error } = await supabase
        .from("pvp_seasons")
        .select("*")
        .eq("is_active", true)
        .order("season_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active season:", error);
        return null;
      }
      return data as unknown as PvPSeason | null;
    },
    staleTime: 60_000,
  });

  const { data: allSeasons, isLoading: allSeasonsLoading, refetch: refetchAllSeasons } = useQuery({
    queryKey: ["pvp-all-seasons"],
    queryFn: async (): Promise<PvPSeason[]> => {
      const { data, error } = await supabase
        .from("pvp_seasons")
        .select("*")
        .order("season_number", { ascending: false });

      if (error) {
        console.error("Error fetching all seasons:", error);
        return [];
      }
      return (data || []) as unknown as PvPSeason[];
    },
    staleTime: 60_000,
  });

  // Countdown timer
  useEffect(() => {
    if (!activeSeason) {
      setCountdown("");
      setTimeRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(activeSeason.ends_at).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setCountdown("Сезон завершён");
        setTimeRemaining(0);
        return;
      }

      setTimeRemaining(diff);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdown(`${days}д ${hours}ч ${minutes}м`);
      } else if (hours > 0) {
        setCountdown(`${hours}ч ${minutes}м ${seconds}с`);
      } else {
        setCountdown(`${minutes}м ${seconds}с`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeSeason]);

  const fetchSeasonLeaderboard = useCallback(async (seasonId: string, limit = 50, rarityTier?: number): Promise<SeasonLeaderboardEntry[]> => {
    const params: any = {
      p_season_id: seasonId,
      p_limit: limit,
    };
    if (rarityTier !== undefined) {
      params.p_rarity_tier = rarityTier;
    }
    const { data, error } = await supabase.rpc("get_pvp_season_leaderboard", params);

    if (error) {
      console.error("Error fetching season leaderboard:", error);
      return [];
    }
    return (data || []) as SeasonLeaderboardEntry[];
  }, []);

  const getPlayerTierReward = useCallback((elo: number): { tierName: string; ellReward: number; bonusCard?: string | boolean } | null => {
    if (!activeSeason?.rewards_config) return null;

    const config = activeSeason.rewards_config;
    for (const [tierKey, tierConfig] of Object.entries(config)) {
      if (elo >= tierConfig.min_elo && elo <= tierConfig.max_elo) {
        return {
          tierName: tierKey,
          ellReward: tierConfig.ell_reward,
          bonusCard: tierConfig.bonus_card,
        };
      }
    }
    return null;
  }, [activeSeason]);

  const getPlayerLeagueReward = useCallback((league: number): { leagueName: string; ellReward: number } | null => {
    if (!activeSeason?.league_rewards_config) return null;

    const leagueConfig = activeSeason.league_rewards_config[String(league)];
    if (!leagueConfig) return null;

    return {
      leagueName: leagueConfig.name,
      ellReward: leagueConfig.ell_reward,
    };
  }, [activeSeason]);

  return {
    activeSeason,
    allSeasons: allSeasons || [],
    seasonLoading,
    allSeasonsLoading,
    countdown,
    timeRemaining,
    fetchSeasonLeaderboard,
    getPlayerTierReward,
    getPlayerLeagueReward,
    refetchSeason,
    refetchAllSeasons,
  };
}
