import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Clock, Gift, Loader2, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { usePvPSeason, PvPSeason, SeasonLeaderboardEntry } from "@/hooks/usePvPSeason";
import { PlacementReward } from "@/components/admin/PlacementRewardEditor";
import { BonusReward } from "@/components/admin/BonusRewardEditor";
import { useDisplayNames } from "@/hooks/useDisplayNames";
import { useAdmin } from "@/contexts/AdminContext";

const RARITY_NAMES: Record<number, string> = {
  1: "Обычные",
  2: "Необычные",
  3: "Редкие",
  4: "Эпические",
  5: "Легендарные",
  6: "Мифические",
  7: "Божественные",
  8: "Трансцендентные"
};

const RARITY_COLORS: Record<number, string> = {
  1: "bg-gray-500",
  2: "bg-green-500",
  3: "bg-blue-500",
  4: "bg-purple-500",
  5: "bg-orange-500",
  6: "bg-red-500",
  7: "bg-pink-500",
  8: "bg-gradient-to-r from-purple-500 to-pink-500"
};

const TIER_LABELS: Record<string, string> = {
  bronze: "Бронза",
  silver: "Серебро",
  gold: "Золото",
  platinum: "Платина",
  diamond: "Алмаз",
  master: "Мастер",
  legend: "Легенда",
};

interface LeaderboardEntry {
  wallet_address: string;
  wins: number;
  losses: number;
  matches_played: number;
  win_rate: number;
}

interface PvPLeaderboardProps {
  currentWallet?: string | null;
  rarityTier: number;
}

export const PvPLeaderboard: React.FC<PvPLeaderboardProps> = ({ currentWallet, rarityTier }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");
  const { isAdmin } = useAdmin();

  const { activeSeason, allSeasons, fetchSeasonLeaderboard, countdown } = usePvPSeason();

  // Season results state
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<SeasonLeaderboardEntry[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<PvPSeason | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, [rarityTier]);

  // Load season leaderboard when switching to season tab
  useEffect(() => {
    if (activeTab === "season" && activeSeason) {
      loadSeasonLeaderboard(activeSeason, rarityTier);
    }
  }, [activeTab, activeSeason, rarityTier]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .rpc('get_pvp_league_stats', {
        p_rarity_tier: rarityTier,
        p_limit: 50
      });

    if (!error && data) {
      const parsed: LeaderboardEntry[] = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : []);
      setLeaderboard(parsed);
    } else {
      setLeaderboard([]);
    }
    setLoading(false);
  };

  const loadSeasonLeaderboard = useCallback(async (season: PvPSeason, tier?: number) => {
    setSelectedSeason(season);
    setSeasonLoading(true);
    const data = await fetchSeasonLeaderboard(season.id, 50, tier);
    setSeasonLeaderboard(data);
    setSeasonLoading(false);
  }, [fetchSeasonLeaderboard]);

  // leaderboard is now loaded directly from RPC (pre-aggregated)

  // Fetch display names for all wallets in leaderboards
  const allWallets = useMemo(() => {
    const wallets = leaderboard.map(e => e.wallet_address);
    seasonLeaderboard.forEach(e => {
      if (!wallets.includes(e.wallet_address)) wallets.push(e.wallet_address);
    });
    return wallets;
  }, [leaderboard, seasonLeaderboard]);
  
  const { getDisplayName } = useDisplayNames(allWallets);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground">{index + 1}</span>;
  };

  const formatWallet = (wallet: string) => {
    const name = getDisplayName(wallet);
    if (isAdmin) {
      const short = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
      // If display name differs from fallback, show both
      if (name !== short && name !== `${wallet.slice(0, 8)}...${wallet.slice(-4)}`) {
        return `${name} (${short})`;
      }
      return short;
    }
    return name;
  };

  const getSeasonTierReward = (season: PvPSeason | null, elo: number, league?: number): number => {
    if (!season?.rewards_config) return 0;
    const config = season.rewards_config;
    
    let tierConfig: Record<string, any>;
    if (league && config[String(league)] && typeof config[String(league)] === 'object') {
      tierConfig = config[String(league)] as Record<string, any>;
    } else if (config.bronze) {
      tierConfig = config as Record<string, any>;
    } else {
      const firstLeague = Object.keys(config).find(k => /^\d+$/.test(k));
      tierConfig = firstLeague ? (config as any)[firstLeague] : config as Record<string, any>;
    }
    
    for (const [, tc] of Object.entries(tierConfig)) {
      if (tc && tc.min_elo !== undefined && elo >= tc.min_elo && elo <= tc.max_elo) {
        return tc.ell_reward || 0;
      }
    }
    return 0;
  };

  // Get placement reward for a specific rank within a tier
  const getPlacementReward = (season: PvPSeason | null, elo: number, rank: number, league?: number): PlacementReward | null => {
    if (!season?.rewards_config) return null;
    const config = season.rewards_config;
    
    let tierConfig: Record<string, any>;
    if (league && config[String(league)] && typeof config[String(league)] === 'object') {
      tierConfig = config[String(league)] as Record<string, any>;
    } else if (config.bronze) {
      tierConfig = config as Record<string, any>;
    } else {
      const firstLeague = Object.keys(config).find(k => /^\d+$/.test(k));
      tierConfig = firstLeague ? (config as any)[firstLeague] : config as Record<string, any>;
    }
    
    for (const [, tc] of Object.entries(tierConfig)) {
      if (tc && tc.min_elo !== undefined && elo >= tc.min_elo && elo <= tc.max_elo) {
        const placements: PlacementReward[] = tc.placement_rewards || [];
        for (const p of placements) {
          if (rank >= p.from_rank && rank <= p.to_rank) {
            return p;
          }
        }
      }
    }
    return null;
  };

  // Find ended seasons for the "past results" selector
  const endedSeasons = allSeasons.filter(s => !s.is_active);

  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Таблица лидеров
          <Badge className={`${RARITY_COLORS[rarityTier]} text-[10px] px-1.5`}>
            {RARITY_NAMES[rarityTier]}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-3">
            <TabsTrigger value="live" className="text-xs">Лига</TabsTrigger>
            <TabsTrigger value="season" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" />
              Сезон
            </TabsTrigger>
          </TabsList>

          {/* Live leaderboard (existing) */}
          <TabsContent value="live" className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет игроков в лиге «{RARITY_NAMES[rarityTier]}»
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {leaderboard.map((entry, index) => {
                  const isCurrentPlayer = entry.wallet_address === currentWallet;
                  return (
                    <div
                      key={entry.wallet_address}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrentPlayer
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${isCurrentPlayer ? "text-primary" : ""}`}>
                            {formatWallet(entry.wallet_address)}
                            {isCurrentPlayer && " (Вы)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="text-green-500">{entry.wins}W</span>
                          <span className="text-red-500">{entry.losses}L</span>
                          <span>{entry.win_rate}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{entry.matches_played}</div>
                        <div className="text-[10px] text-muted-foreground">матчей</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Season leaderboard */}
          <TabsContent value="season" className="mt-0">
            {/* Season selector for ended seasons */}
            {endedSeasons.length > 0 && (
              <div className="flex gap-1 mb-3 flex-wrap">
                {activeSeason && (
                  <Button
                    variant={selectedSeason?.id === activeSeason.id ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => loadSeasonLeaderboard(activeSeason, rarityTier)}
                  >
                    Текущий
                  </Button>
                )}
                {endedSeasons.slice(0, 5).map(s => (
                  <Button
                    key={s.id}
                    variant={selectedSeason?.id === s.id ? "default" : "outline"}
                    size="sm"
                    className="text-[10px] h-6 px-2"
                    onClick={() => loadSeasonLeaderboard(s, rarityTier)}
                  >
                    #{s.season_number}
                  </Button>
                ))}
              </div>
            )}

            {/* Season info header */}
            {selectedSeason && (
              <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{selectedSeason.name}</div>
                  <div className="flex items-center gap-1">
                    {selectedSeason.is_active ? (
                      <Badge variant="outline" className="text-[10px]">
                        <Clock className="w-2.5 h-2.5 mr-0.5" />
                        {countdown}
                      </Badge>
                    ) : selectedSeason.rewards_distributed ? (
                      <Badge className="bg-green-600 text-white text-[10px]">
                        <Gift className="w-2.5 h-2.5 mr-0.5" />
                        Награды розданы
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-600 text-black text-[10px]">Ожидает наград</Badge>
                    )}
                  </div>
                </div>
                {/* League rewards info banner */}
                {selectedSeason.league_rewards_config && Object.keys(selectedSeason.league_rewards_config).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-muted/50">
                    <div className="text-[10px] text-muted-foreground mb-1">Награды по лигам:</div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(selectedSeason.league_rewards_config).map(([key, val]) => {
                        const config = val as { name: string; ell_reward: number };
                        return config.ell_reward > 0 ? (
                          <Badge key={key} variant="outline" className="text-[9px] px-1 py-0">
                            ★{key}: {config.ell_reward}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Season leaderboard entries */}
            {seasonLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : !selectedSeason ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                {activeSeason ? "Загрузка сезона..." : "Нет активного сезона"}
              </div>
            ) : seasonLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Нет участников в этом сезоне
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {seasonLeaderboard.map((entry) => {
                  const isCurrentPlayer = entry.wallet_address === currentWallet;
                  const reward = getSeasonTierReward(selectedSeason, entry.elo, rarityTier);
                  const placementReward = getPlacementReward(selectedSeason, entry.elo, Number(entry.rank), rarityTier);
                  return (
                    <div
                      key={entry.wallet_address}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isCurrentPlayer
                          ? "bg-primary/20 border border-primary/50"
                          : "bg-muted/30 hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        {getRankIcon(Number(entry.rank) - 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium truncate ${isCurrentPlayer ? "text-primary" : ""}`}>
                            {formatWallet(entry.wallet_address)}
                            {isCurrentPlayer && " (Вы)"}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1">
                            {TIER_LABELS[entry.tier] || entry.tier}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{entry.elo} Elo</span>
                          <span className="text-green-500">{entry.wins}W</span>
                          <span className="text-red-500">{entry.losses}L</span>
                        </div>
                        {/* Placement reward info */}
                        {placementReward && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Award className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                            {placementReward.ell_reward > 0 && (
                              <span className="text-[10px] text-yellow-500 font-medium">+{placementReward.ell_reward} ELL</span>
                            )}
                            {placementReward.bonus_rewards?.map((bonus: BonusReward, i: number) => (
                              <Badge key={i} variant="outline" className="text-[9px] px-1 py-0 bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                                {bonus.name} ×{bonus.quantity}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {reward > 0 && (
                          <>
                            <div className="text-sm font-bold text-yellow-500">{reward}</div>
                            <div className="text-[10px] text-muted-foreground">ELL</div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
