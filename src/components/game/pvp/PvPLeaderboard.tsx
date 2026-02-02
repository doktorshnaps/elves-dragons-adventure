import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase";

const TIER_COLORS: Record<string, string> = {
  bronze: "bg-amber-700 text-white",
  silver: "bg-gray-400 text-black",
  gold: "bg-yellow-500 text-black",
  platinum: "bg-cyan-400 text-black",
  diamond: "bg-blue-400 text-white",
  master: "bg-purple-600 text-white",
  legend: "bg-gradient-to-r from-amber-500 to-red-500 text-white",
};

const TIER_NAMES: Record<string, string> = {
  bronze: "Бронза",
  silver: "Серебро",
  gold: "Золото",
  platinum: "Платина",
  diamond: "Алмаз",
  master: "Мастер",
  legend: "Легенда",
};

const TIER_RANGES: Record<string, string> = {
  bronze: "0-1199",
  silver: "1200-1399",
  gold: "1400-1599",
  platinum: "1600-1799",
  diamond: "1800-1999",
  master: "2000-2199",
  legend: "2200+",
};

// От слабых к сильным (слева направо)
const TIERS_ORDER = ["bronze", "silver", "gold", "platinum", "diamond", "master", "legend"];

interface LeaderboardEntry {
  wallet_address: string;
  elo: number;
  tier: string;
  wins: number;
  losses: number;
  win_streak: number;
  matches_played: number;
}

interface PvPLeaderboardProps {
  currentWallet?: string | null;
}

export const PvPLeaderboard: React.FC<PvPLeaderboardProps> = ({ currentWallet }) => {
  const [selectedTier, setSelectedTier] = useState<string>("bronze");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedTier]);

  const loadLeaderboard = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("pvp_ratings")
      .select("wallet_address, elo, tier, wins, losses, win_streak, matches_played")
      .eq("tier", selectedTier)
      .gt("matches_played", 0)
      .order("elo", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLeaderboard(data);
    }
    setLoading(false);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm text-muted-foreground">{index + 1}</span>;
  };

  const formatWallet = (wallet: string) => {
    if (wallet.startsWith("BOT_")) {
      return `🤖 ${wallet.slice(4, 14)}...`;
    }
    return `${wallet.slice(0, 8)}...${wallet.slice(-4)}`;
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    if (total === 0) return 0;
    return Math.round((wins / total) * 100);
  };

  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Таблица лидеров
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bronze" onValueChange={setSelectedTier}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 mb-4">
            {TIERS_ORDER.map((tier) => (
              <TabsTrigger
                key={tier}
                value={tier}
                className="text-[10px] sm:text-xs flex flex-col items-center gap-0 py-1.5 px-2"
              >
                <span>{TIER_NAMES[tier]}</span>
                <span className="text-[8px] sm:text-[10px] opacity-70">{TIER_RANGES[tier]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedTier} className="mt-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Нет игроков в этой лиге
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
                          <Badge className={`${TIER_COLORS[entry.tier]} text-[10px] px-1.5 py-0`}>
                            {TIER_NAMES[entry.tier]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="text-green-500">{entry.wins}W</span>
                          <span className="text-red-500">{entry.losses}L</span>
                          <span>{getWinRate(entry.wins, entry.losses)}%</span>
                          {entry.win_streak > 2 && (
                            <span className="flex items-center gap-0.5 text-yellow-500">
                              <Star className="w-3 h-3" />
                              {entry.win_streak}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold">{entry.elo}</div>
                        <div className="text-[10px] text-muted-foreground">ELO</div>
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
