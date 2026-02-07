import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Swords, Trophy, Clock, Coins, ArrowLeft, Search, X, Loader2, Star, Bot, History, Eye, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePvP } from "@/hooks/usePvP";
import { PvPLeaderboard } from "./PvPLeaderboard";
import { PvPMatchHistory } from "./PvPMatchHistory";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { usePlayerTeams, TeamPair } from "@/hooks/usePlayerTeams";
import { normalizeCardImageUrl } from "@/utils/cardImageResolver";
import { usePvPSeason } from "@/hooks/usePvPSeason";

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

const RARITY_TIERS = [
  { tier: 1, name: "Обычные", range: "1" },
  { tier: 2, name: "Необычные", range: "1-2" },
  { tier: 3, name: "Редкие", range: "1-3" },
  { tier: 4, name: "Эпические", range: "1-4" },
  { tier: 5, name: "Легендарные", range: "1-5" },
  { tier: 6, name: "Мифические", range: "1-6" },
  { tier: 7, name: "Божественные", range: "1-7" },
  { tier: 8, name: "Трансцендентные", range: "1-8" },
];

const BOT_FALLBACK_SECONDS = 30;

export const PvPHub: React.FC = () => {
  const navigate = useNavigate();
  const { accountId: walletAddress } = useWalletContext();
  const [selectedRarityTier, setSelectedRarityTier] = useState(1);
  const [togglingBot, setTogglingBot] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);

  const { activeSeason, countdown, getPlayerTierReward, getPlayerLeagueReward } = usePvPSeason();

  const { getPvPTeam, loading: teamsLoading, switchTeam } = usePlayerTeams();

  const selectedPairs = useMemo(() => {
    return getPvPTeam(selectedRarityTier);
  }, [getPvPTeam, selectedRarityTier]);

  // ✅ PvP использует МАКСИМАЛЬНЫЕ характеристики (полное здоровье/броня)
  // Реальные current_health/current_defense не затрагиваются - они сохраняют урон из подземелья
  const teamStats = useMemo(() => {
    let power = 0,
      defense = 0,
      health = 0;
    selectedPairs.forEach((pair: TeamPair) => {
      power += pair.hero?.power || 0;
      // В PvP всегда показываем максимальные характеристики
      defense += pair.hero?.defense || 0;
      health += pair.hero?.health || 0;
      if (pair.dragon) {
        power += pair.dragon.power || 0;
        defense += pair.dragon.defense || 0;
        health += pair.dragon.health || 0;
      }
    });
    return { power, defense, health };
  }, [selectedPairs]);

  const normalizeSnapshotImage = (url?: string) => {
    // Сохраняем в снапшот УЖЕ нормализованный URL (как в подземелье):
    // - /lovable-uploads -> Supabase Storage public URL
    // - png -> webp
    // - ipfs/arweave normalizations
    return normalizeCardImageUrl(url);
  };

  // ✅ Снапшот для PvP боя - ВСЕГДА с полными характеристиками
  // currentHealth = health, currentDefense = defense
  // Это виртуальное состояние для боя, реальные данные карточек не меняются
  // ✅ Также включаем image для корректного отображения карточек в бою
  const createTeamSnapshot = useMemo(() => {
    return selectedPairs.map((pair: TeamPair) => ({
      hero: {
        name: pair.hero?.name,
        power: pair.hero?.power,
        defense: pair.hero?.defense,
        health: pair.hero?.health,
        currentHealth: pair.hero?.health,
        currentDefense: pair.hero?.defense,
        faction: pair.hero?.faction,
        rarity: pair.hero?.rarity, // Добавить
        image: normalizeSnapshotImage(pair.hero?.image),
      },
      dragon: pair.dragon
        ? {
            name: pair.dragon.name,
            power: pair.dragon.power,
            defense: pair.dragon.defense,
            health: pair.dragon.health,
            currentHealth: pair.dragon.health,
            currentDefense: pair.dragon.defense,
            faction: pair.dragon.faction,
            rarity: pair.dragon.rarity, // Добавить
            image: normalizeSnapshotImage(pair.dragon.image),
          }
        : null,
      totalPower: (pair.hero?.power || 0) + (pair.dragon?.power || 0),
      totalDefense: (pair.hero?.defense || 0) + (pair.dragon?.defense || 0),
      totalHealth: (pair.hero?.health || 0) + (pair.dragon?.health || 0),
      // ✅ Итоговые характеристики пары - тоже максимальные
      currentHealth: (pair.hero?.health || 0) + (pair.dragon?.health || 0),
      currentDefense: (pair.hero?.defense || 0) + (pair.dragon?.defense || 0),
    }));
  }, [selectedPairs]);

  const {
    rating,
    activeMatches,
    queueStatus,
    loading,
    balance,
    joinQueue,
    leaveQueue,
    toggleBotTeam,
    isBotEnabledForTier,
  } = usePvP(walletAddress);

  const entryFee = 100;
  const hasEnoughBalance = balance >= entryFee;
  const hasTeam = selectedPairs.length > 0;
  const isBotEnabled = isBotEnabledForTier(selectedRarityTier);

  // Auto-navigate to battle when match is found
  useEffect(() => {
    if (queueStatus.status === "matched" && queueStatus.matchedMatchId) {
      console.log("[PvPHub] Auto-navigating to match:", queueStatus.matchedMatchId);
      navigate(`/pvp/battle/${queueStatus.matchedMatchId}`);
    }
  }, [queueStatus.status, queueStatus.matchedMatchId, navigate]);

  const handleJoinQueue = async () => {
    if (!hasTeam) {
      switchTeam("pvp", selectedRarityTier);
      navigate("/team");
      return;
    }

    await joinQueue(selectedRarityTier, createTeamSnapshot);
  };

  const handleToggleBot = async () => {
    if (!hasTeam) {
      return;
    }

    setTogglingBot(true);
    await toggleBotTeam(selectedRarityTier, createTeamSnapshot, !isBotEnabled);
    setTogglingBot(false);
  };

  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const secondsUntilBot = Math.max(0, BOT_FALLBACK_SECONDS - queueStatus.searchTime);

  return (
    <div className="min-h-screen bg-pvp p-4 relative">
      <div className="absolute inset-0 bg-black/50" />
      <div className="max-w-4xl mx-auto space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/menu")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Меню
          </Button>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span className="font-bold">{balance} ELL</span>
          </div>
        </div>

        {/* Season Banner */}
        {activeSeason && (
          <Card className="bg-card/80 backdrop-blur border-primary/30">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">{activeSeason.name}</span>
                  <Badge variant="outline" className="text-[10px]">#{activeSeason.season_number}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{countdown}</span>
                </div>
              </div>
              {rating && (() => {
                const reward = getPlayerTierReward(rating.elo);
                const leagueReward = getPlayerLeagueReward(selectedRarityTier);
                return (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {reward && (
                      <span>Тир: <span className="text-yellow-500 font-medium">{reward.ellReward} ELL</span></span>
                    )}
                    {leagueReward && leagueReward.ellReward > 0 && (
                      <span className="ml-2">Лига ★{selectedRarityTier}: <span className="text-yellow-500 font-medium">+{leagueReward.ellReward} ELL</span></span>
                    )}
                    {reward?.bonusCard && <span className="ml-1">(+карта)</span>}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Rating Card */}
        <Card className="bg-card/80 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              PvP Арена
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{rating?.elo || 1000}</div>
                <div className="text-sm text-muted-foreground">Рейтинг</div>
              </div>
              <div className="text-center">
                <Badge className={TIER_COLORS[rating?.tier || "bronze"]}>{TIER_NAMES[rating?.tier || "bronze"]}</Badge>
                <div className="text-sm text-muted-foreground mt-1">Лига</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{rating?.wins || 0}</div>
                <div className="text-sm text-muted-foreground">Побед</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{rating?.losses || 0}</div>
                <div className="text-sm text-muted-foreground">Поражений</div>
              </div>
            </div>

            {rating && rating.win_streak > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>Серия побед: {rating.win_streak}</span>
                {rating.best_win_streak > rating.win_streak && (
                  <span className="text-muted-foreground">(рекорд: {rating.best_win_streak})</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Matches */}
        {activeMatches.length > 0 && (
          <Card className="bg-card/80 backdrop-blur border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Swords className="w-4 h-4" />
                Активные матчи ({activeMatches.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {activeMatches.map((match) => (
                <Button
                  key={match.id}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => navigate(`/pvp/battle/${match.id}`)}
                >
                  <span className="flex items-center gap-2">
                    {match.is_bot_match && <Bot className="w-4 h-4 text-muted-foreground" />}
                    vs{" "}
                    {match.player1_wallet === walletAddress
                      ? match.player2_wallet.slice(0, 10)
                      : match.player1_wallet.slice(0, 10)}
                    ...
                  </span>
                  <Badge variant={match.current_turn_wallet === walletAddress ? "default" : "secondary"}>
                    {match.current_turn_wallet === walletAddress ? "Ваш ход" : "Ход противника"}
                  </Badge>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Queue / Search UI */}
        <Card className="bg-card/80 backdrop-blur">
          <CardContent className="pt-6">
            {queueStatus.isSearching ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-lg">Поиск противника...</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{formatSearchTime(queueStatus.searchTime)}</span>
                </div>

                {/* Bot fallback countdown */}
                {secondsUntilBot > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    <Bot className="w-4 h-4 inline mr-1" />
                    Бот-противник через {secondsUntilBot} сек
                  </div>
                ) : (
                  <div className="text-sm text-yellow-500">
                    <Bot className="w-4 h-4 inline mr-1" />
                    Ищем бота...
                  </div>
                )}

                <Button variant="destructive" onClick={leaveQueue}>
                  <X className="w-4 h-4 mr-2" />
                  Отменить поиск
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Rarity Tier Selection */}
                <div>
                  <div className="text-sm font-medium mb-2">Выберите лигу редкости:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {RARITY_TIERS.map(({ tier, name, range }) => (
                      <Button
                        key={tier}
                        variant={selectedRarityTier === tier ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedRarityTier(tier)}
                        className="flex flex-col gap-0 h-auto py-1.5"
                      >
                        <span className="text-xs leading-tight">{name}</span>
                        <span className="text-[10px] opacity-70 leading-tight">★ {range}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Team Info */}
                {hasTeam ? (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">Ваша команда:</div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowTeamDialog(true)}>
                        <Eye className="w-3 h-3" />
                        Посмотреть
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <Swords className="w-4 h-4 mx-auto text-red-500" />
                        <div>{teamStats.power}</div>
                      </div>
                      <div>
                        <span className="text-blue-500">🛡️</span>
                        <div>{teamStats.defense}</div>
                      </div>
                      <div>
                        <span className="text-green-500">❤️</span>
                        <div>{teamStats.health}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Соберите команду перед началом PvP</p>
                  </div>
                )}

                {/* Bot Toggle */}
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">Бот-режим</div>
                        <div className="text-xs text-muted-foreground">Разрешить использовать мою команду как бота</div>
                      </div>
                    </div>
                    <Switch
                      checked={isBotEnabled}
                      onCheckedChange={handleToggleBot}
                      disabled={!hasTeam || togglingBot}
                    />
                  </div>
                  {isBotEnabled && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      ✓ Ваша команда может биться с игроками пока вы офлайн.
                      <br />
                      Рейтинг бота не меняется при победах/поражениях.
                    </div>
                  )}
                </div>

                {/* Entry Fee */}
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm">Вступительный взнос:</span>
                  <span className="font-bold flex items-center gap-1">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {entryFee} ELL
                  </span>
                </div>

                {/* Search Button */}
                <Button className="w-full" size="lg" onClick={handleJoinQueue} disabled={loading || !hasEnoughBalance}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  {!hasTeam ? "Собрать команду" : !hasEnoughBalance ? "Недостаточно ELL" : "Найти противника"}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Победитель получает {entryFee * 2 - 10} ELL (90% пула)
                  <br />
                  <span className="text-yellow-600">⚡ После 30 сек поиска — матч с ботом</span>
                  <br />
                  <span className="opacity-70">Лига {selectedRarityTier}: допускаются карты редкости {selectedRarityTier} и ниже</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bot rating explanation */}
        <Card className="bg-card/50 backdrop-blur border-muted">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-medium text-foreground mb-2">📊 Рейтинг в матчах с ботами:</div>
              <div>
                • Вы победили бота → <span className="text-green-500">+Elo</span>
              </div>
              <div>
                • Вы проиграли боту → <span className="text-red-500">-Elo</span>
              </div>
              <div>
                • Ваш бот победил/проиграл → <span className="text-muted-foreground">рейтинг не меняется</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard & Match History Tabs */}
        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Лидеры</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">История</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard" className="mt-4">
            <PvPLeaderboard currentWallet={walletAddress} rarityTier={selectedRarityTier} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <PvPMatchHistory walletAddress={walletAddress} rarityTier={selectedRarityTier} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Team Preview Dialog */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Команда — Лига {selectedRarityTier}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedPairs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Команда не собрана</p>
            ) : (
              selectedPairs.map((pair: TeamPair, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {pair.hero?.image ? (
                      <img
                        src={normalizeCardImageUrl(pair.hero.image)}
                        alt={pair.hero.name}
                        className="w-10 h-10 rounded object-cover border border-border"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">?</div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{pair.hero?.name || 'Герой'}</div>
                      <div className="text-xs text-muted-foreground">
                        ⚔{pair.hero?.power || 0} 🛡{pair.hero?.defense || 0} ❤{pair.hero?.health || 0}
                      </div>
                    </div>
                  </div>
                  {pair.dragon && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {pair.dragon.image ? (
                        <img
                          src={normalizeCardImageUrl(pair.dragon.image)}
                          alt={pair.dragon.name}
                          className="w-10 h-10 rounded object-cover border border-border"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">🐉</div>
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{pair.dragon.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ⚔{pair.dragon.power || 0} 🛡{pair.dragon.defense || 0} ❤{pair.dragon.health || 0}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <Button variant="outline" className="w-full" onClick={() => { setShowTeamDialog(false); switchTeam("pvp", selectedRarityTier); navigate("/team"); }}>
              Изменить команду
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
