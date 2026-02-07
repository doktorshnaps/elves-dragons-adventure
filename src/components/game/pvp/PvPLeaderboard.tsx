import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Clock, Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { usePvPSeason, PvPSeason, SeasonLeaderboardEntry } from "@/hooks/usePvPSeason";

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
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("live");

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
      loadSeasonLeaderboard(activeSeason);
    }
  }, [activeTab, activeSeason]);

  const loadLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pvp_matches")
      .select("player1_wallet, player2_wallet, winner_wallet, loser_wallet")
      .eq("status", "completed")
      .eq("rarity_tier", rarityTier)
      .order("finished_at", { ascending: false })
      .limit(500);

    if (!error && data) {
      setMatches(data);
    }
    setLoading(false);
  };

  const loadSeasonLeaderboard = useCallback(async (season: PvPSeason) => {
    setSelectedSeason(season);
    setSeasonLoading(true);
    const data = await fetchSeasonLeaderboard(season.id, 50);
    setSeasonLeaderboard(data);
    setSeasonLoading(false);
  }, [fetchSeasonLeaderboard]);

  // Compute leaderboard from match data
  const leaderboard = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number }> = {};

    matches.forEach((match) => {
      const { player1_wallet, player2_wallet, winner_wallet } = match;
      
      if (!player1_wallet.startsWith("BOT_")) {
        if (!stats[player1_wallet]) stats[player1_wallet] = { wins: 0, losses: 0 };
        if (winner_wallet === player1_wallet) {
          stats[player1_wallet].wins++;
        } else if (winner_wallet) {
          stats[player1_wallet].losses++;
        }
      }

      if (!player2_wallet.startsWith("BOT_")) {
        if (!stats[player2_wallet]) stats[player2_wallet] = { wins: 0, losses: 0 };
        if (winner_wallet === player2_wallet) {
          stats[player2_wallet].wins++;
        } else if (winner_wallet) {
          stats[player2_wallet].losses++;
        }
      }
    });

    const entries: LeaderboardEntry[] = Object.entries(stats).map(([wallet, s]) => ({
      wallet_address: wallet,
      wins: s.wins,
      losses: s.losses,
      matches_played: s.wins + s.losses,
      win_rate: s.wins + s.losses > 0 ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0,
    }));

    entries.sort((a, b) => b.wins - a.wins || b.win_rate - a.win_rate);
    return entries.slice(0, 50);
  }, [matches]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground">{index + 1}</span>;
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 8)}...${wallet.slice(-4)}`;
  };

  const getSeasonTierReward = (season: PvPSeason | null, elo: number): number => {
    if (!season?.rewards_config) return 0;
    const config = season.rewards_config;
    for (const [, tierConfig] of Object.entries(config)) {
      if (elo >= tierConfig.min_elo && elo <= tierConfig.max_elo) {
        return tierConfig.ell_reward || 0;
      }
    }
    return 0;
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
                    onClick={() => loadSeasonLeaderboard(activeSeason)}
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
                    onClick={() => loadSeasonLeaderboard(s)}
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
                  const reward = getSeasonTierReward(selectedSeason, entry.elo);
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
