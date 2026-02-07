import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase";

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

  useEffect(() => {
    loadLeaderboard();
  }, [rarityTier]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    // Fetch completed matches for this rarity tier
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

  // Compute leaderboard from match data
  const leaderboard = useMemo(() => {
    const stats: Record<string, { wins: number; losses: number }> = {};

    matches.forEach((match) => {
      const { player1_wallet, player2_wallet, winner_wallet } = match;
      
      // Skip BOT wallets from leaderboard
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

    // Sort by wins, then by win_rate
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
      </CardContent>
    </Card>
  );
};
