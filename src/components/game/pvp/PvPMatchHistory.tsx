import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Swords, TrendingUp, TrendingDown, Bot, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface MatchHistoryEntry {
  id: string;
  player1_wallet: string;
  player2_wallet: string;
  winner_wallet: string | null;
  loser_wallet: string | null;
  elo_change: number | null;
  player1_elo_before: number;
  player2_elo_before: number;
  finished_at: string | null;
  is_bot_match: boolean;
  rarity_tier: number;
}

interface PvPMatchHistoryProps {
  walletAddress: string | null;
  rarityTier: number;
}

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

export const PvPMatchHistory: React.FC<PvPMatchHistoryProps> = ({ walletAddress, rarityTier }) => {
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      loadMatchHistory();
    }
  }, [walletAddress, rarityTier]);

  const loadMatchHistory = async () => {
    if (!walletAddress) return;
    
    setLoading(true);

    const { data, error } = await supabase
      .rpc('get_my_match_history', {
        p_wallet: walletAddress,
        p_rarity_tier: rarityTier,
        p_limit: 20
      });

    console.log("[PvP History] RPC result:", { walletAddress, rarityTier, data, error });
    if (!error && data) {
      // RPC returns jsonb array
      const parsed = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : []);
      setMatches(parsed);
    }
    setLoading(false);
  };

  const formatWallet = (wallet: string) => {
    if (wallet.startsWith("BOT_")) {
      return `🤖 Бот`;
    }
    return `${wallet.slice(0, 6)}...`;
  };

  const getMatchResult = (match: MatchHistoryEntry) => {
    const isWinner = match.winner_wallet === walletAddress;
    const isPlayer1 = match.player1_wallet === walletAddress;
    
    const myEloBefore = isPlayer1 ? match.player1_elo_before : match.player2_elo_before;
    const eloChange = match.elo_change || 0;
    const myEloAfter = isWinner ? myEloBefore + eloChange : myEloBefore - eloChange;
    
    const opponentWallet = isPlayer1 ? match.player2_wallet : match.player1_wallet;
    
    return {
      isWinner,
      eloChange: isWinner ? `+${eloChange}` : `-${eloChange}`,
      eloAfter: myEloAfter,
      opponent: formatWallet(opponentWallet),
      isBotMatch: match.is_bot_match || opponentWallet.startsWith("BOT_")
    };
  };

  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-primary" />
          История матчей
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
        ) : !walletAddress ? (
          <div className="text-center py-8 text-muted-foreground">
            Подключите кошелек для просмотра истории
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Swords className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Нет матчей в лиге «{RARITY_NAMES[rarityTier]}»
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-2">
            <div className="space-y-2">
              {matches.map((match) => {
                const result = getMatchResult(match);
                return (
                  <div
                    key={match.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      result.isWinner
                        ? "bg-green-500/10 border-green-500/30"
                        : "bg-red-500/10 border-red-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={result.isWinner ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {result.isWinner ? "ПОБЕДА" : "ПОРАЖЕНИЕ"}
                        </Badge>
                        {result.isBotMatch && (
                          <Bot className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className={`flex items-center gap-1 font-bold ${
                        result.isWinner ? "text-green-500" : "text-red-500"
                      }`}>
                        {result.isWinner ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {result.eloChange}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Swords className="w-4 h-4" />
                        <span>vs {result.opponent}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{result.eloAfter} ELO</div>
                      </div>
                    </div>

                    {match.finished_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(match.finished_at), {
                          addSuffix: true,
                          locale: ru
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
