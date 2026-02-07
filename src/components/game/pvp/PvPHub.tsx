import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Swords, Trophy, Clock, Coins, ArrowLeft, Search, X, Loader2,
  Star, Bot, History, Eye, Calendar, Info, ChevronDown, Shield, Heart,
  TrendingUp, Percent, Flame
} from "lucide-react";
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

// Elo thresholds for tier progress bar
const TIER_THRESHOLDS: Record<string, { min: number; max: number; next: string }> = {
  bronze: { min: 0, max: 1199, next: "Серебро" },
  silver: { min: 1200, max: 1399, next: "Золото" },
  gold: { min: 1400, max: 1599, next: "Платина" },
  platinum: { min: 1600, max: 1799, next: "Алмаз" },
  diamond: { min: 1800, max: 1999, next: "Мастер" },
  master: { min: 2000, max: 2199, next: "Легенда" },
  legend: { min: 2200, max: 3000, next: "" },
};

const RARITY_TIERS = [
  { tier: 1, name: "Обычные", short: "1", range: "1" },
  { tier: 2, name: "Необычные", short: "2", range: "1-2" },
  { tier: 3, name: "Редкие", short: "3", range: "1-3" },
  { tier: 4, name: "Эпические", short: "4", range: "1-4" },
  { tier: 5, name: "Легендарные", short: "5", range: "1-5" },
  { tier: 6, name: "Мифические", short: "6", range: "1-6" },
  { tier: 7, name: "Божественные", short: "7", range: "1-7" },
  { tier: 8, name: "Трансцендентные", short: "8", range: "1-8" },
];

const BOT_FALLBACK_SECONDS = 30;

export const PvPHub: React.FC = () => {
  const navigate = useNavigate();
  const { accountId: walletAddress } = useWalletContext();
  const [selectedRarityTier, setSelectedRarityTier] = useState(1);
  const [togglingBot, setTogglingBot] = useState(false);
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  const { activeSeason, countdown, getPlayerTierReward, getPlayerLeagueReward } = usePvPSeason();
  const { getPvPTeam, loading: teamsLoading, switchTeam } = usePlayerTeams();

  const selectedPairs = useMemo(() => {
    return getPvPTeam(selectedRarityTier);
  }, [getPvPTeam, selectedRarityTier]);

  const teamStats = useMemo(() => {
    let power = 0, defense = 0, health = 0;
    selectedPairs.forEach((pair: TeamPair) => {
      power += pair.hero?.power || 0;
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
    return normalizeCardImageUrl(url);
  };

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
        rarity: pair.hero?.rarity,
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
            rarity: pair.dragon.rarity,
            image: normalizeSnapshotImage(pair.dragon.image),
          }
        : null,
      totalPower: (pair.hero?.power || 0) + (pair.dragon?.power || 0),
      totalDefense: (pair.hero?.defense || 0) + (pair.dragon?.defense || 0),
      totalHealth: (pair.hero?.health || 0) + (pair.dragon?.health || 0),
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
  } = usePvP(walletAddress, selectedRarityTier);

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
    if (!hasTeam) return;
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

  // Tier progress calculation
  const currentTier = rating?.tier || "bronze";
  const currentElo = rating?.elo || 1000;
  const tierInfo = TIER_THRESHOLDS[currentTier] || TIER_THRESHOLDS.bronze;
  const tierProgress = Math.min(100, Math.max(0, ((currentElo - tierInfo.min) / (tierInfo.max - tierInfo.min + 1)) * 100));

  // Winrate
  const totalGames = (rating?.wins || 0) + (rating?.losses || 0);
  const winRate = totalGames > 0 ? Math.round(((rating?.wins || 0) / totalGames) * 100) : 0;

  // Season rewards preview
  const seasonRewardPreview = useMemo(() => {
    if (!activeSeason || !rating) return null;
    const reward = getPlayerTierReward(rating.elo, selectedRarityTier);
    const leagueReward = getPlayerLeagueReward(selectedRarityTier);
    return { tierReward: reward, leagueReward };
  }, [activeSeason, rating, selectedRarityTier, getPlayerTierReward, getPlayerLeagueReward]);

  return (
    <TooltipProvider>
      <div className="h-screen bg-pvp relative flex flex-col">
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-3">

            {/* ═══════════════════════════════════════════════ */}
            {/* BELT 1: Header — Title, Rating, KPIs */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="space-y-2">
              {/* Top nav row */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => navigate("/menu")} className="text-muted-foreground hover:text-foreground h-8 px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="text-xs">Меню</span>
                </Button>
                <div className="flex items-center gap-1.5 text-sm">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">{balance} ELL</span>
                </div>
              </div>

              {/* Main header card */}
              <Card className="bg-card/90 backdrop-blur border-primary/20 overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Title + Rating */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Swords className="w-5 h-5 text-primary flex-shrink-0" />
                        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">PvP Арена</h1>
                      </div>
                      {activeSeason && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <Calendar className="w-3 h-3" />
                          <span className="truncate">{activeSeason.name}</span>
                          <span className="text-primary/60">•</span>
                          <Clock className="w-3 h-3" />
                          <span>{countdown}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge className={`${TIER_COLORS[currentTier]} text-xs px-2 py-0.5`}>
                          {TIER_NAMES[currentTier]}
                        </Badge>
                        <span className="text-2xl sm:text-3xl font-black text-primary tabular-nums">{currentElo}</span>
                      </div>
                      {/* Tier progress bar */}
                      {tierInfo.next && (
                        <div className="mt-2 space-y-0.5">
                          <Progress value={tierProgress} className="h-1.5 bg-muted/50" indicatorClassName="bg-primary" />
                          <div className="text-[10px] text-muted-foreground">
                            До «{tierInfo.next}»: {Math.max(0, tierInfo.max + 1 - currentElo)} Elo
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: KPI block */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right flex-shrink-0">
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-green-500">{rating?.wins || 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Побед</div>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-red-500">{rating?.losses || 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Поражений</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-cyan-400 flex items-center justify-end gap-0.5">
                          <Percent className="w-3 h-3" />
                          {winRate}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Винрейт</div>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-primary flex items-center justify-end gap-0.5">
                          <Flame className="w-3 h-3" />
                          {rating?.win_streak || 0}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Серия</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Matches Banner */}
            {activeMatches.length > 0 && (
              <Card className="bg-primary/10 border-primary/40 backdrop-blur">
                <CardContent className="p-2.5">
                  <div className="text-xs font-medium text-primary mb-1.5 flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5" />
                    Активные матчи ({activeMatches.length})
                  </div>
                  <div className="space-y-1.5">
                    {activeMatches.map((match) => (
                      <Button
                        key={match.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-between h-8 text-xs border-primary/30"
                        onClick={() => navigate(`/pvp/battle/${match.id}`)}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          {match.is_bot_match && <Bot className="w-3 h-3 text-muted-foreground" />}
                          vs {match.player1_wallet === walletAddress
                            ? match.player2_wallet.slice(0, 10)
                            : match.player1_wallet.slice(0, 10)}...
                        </span>
                        <Badge
                          variant={match.current_turn_wallet === walletAddress ? "default" : "secondary"}
                          className="text-[10px] ml-1"
                        >
                          {match.current_turn_wallet === walletAddress ? "Ваш ход" : "Ход противника"}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* BELT 2: Battle Setup — League, Team, CTA */}
            {/* ═══════════════════════════════════════════════ */}
            <Card className="bg-card/90 backdrop-blur border-primary/10">
              <CardContent className="p-3 sm:p-4 space-y-3">
                {queueStatus.isSearching ? (
                  /* Searching state */
                  <div className="text-center space-y-3 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-base font-medium">Поиск противника...</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="tabular-nums">{formatSearchTime(queueStatus.searchTime)}</span>
                    </div>
                    {secondsUntilBot > 0 ? (
                      <div className="text-xs text-muted-foreground">
                        <Bot className="w-3.5 h-3.5 inline mr-1" />
                        Бот-противник через {secondsUntilBot} сек
                      </div>
                    ) : (
                      <div className="text-xs text-primary animate-pulse-slow">
                        <Bot className="w-3.5 h-3.5 inline mr-1" />
                        Ищем бота...
                      </div>
                    )}
                    <Button variant="destructive" size="sm" onClick={leaveQueue} className="mt-2">
                      <X className="w-4 h-4 mr-1" />
                      Отменить
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* League selector */}
                    <div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Выберите лигу</div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {RARITY_TIERS.map(({ tier, name, range }) => {
                          const isActive = selectedRarityTier === tier;
                          return (
                            <button
                              key={tier}
                              onClick={() => setSelectedRarityTier(tier)}
                              className={`relative rounded-md px-1 py-2 text-center transition-all duration-200 border ${
                                isActive
                                  ? "bg-primary/20 border-primary text-primary shadow-[inset_0_0_12px_rgba(251,191,36,0.15)]"
                                  : "bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                              }`}
                            >
                              <div className="text-[11px] sm:text-xs font-medium leading-tight">{name}</div>
                              <div className="text-[9px] sm:text-[10px] opacity-60 leading-tight">★ {range}</div>
                              {isActive && (
                                <div className="absolute inset-0 rounded-md ring-1 ring-primary/50 pointer-events-none" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Team Card */}
                    {hasTeam ? (
                      <div className="bg-muted/30 rounded-lg p-2.5 border border-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-foreground">Ваша команда</span>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground" onClick={() => setShowTeamDialog(true)}>
                            <Eye className="w-3 h-3" />
                            Подробнее
                          </Button>
                        </div>
                        {/* Avatars row */}
                        <div className="flex items-center gap-1.5 mb-2">
                          {selectedPairs.map((pair: TeamPair, idx: number) => (
                            <React.Fragment key={idx}>
                              {pair.hero?.image ? (
                                <img
                                  src={normalizeCardImageUrl(pair.hero.image)}
                                  alt={pair.hero.name || ""}
                                  className="w-9 h-9 sm:w-10 sm:h-10 rounded border border-border object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                />
                              ) : (
                                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground">?</div>
                              )}
                              {pair.dragon?.image && (
                                <img
                                  src={normalizeCardImageUrl(pair.dragon.image)}
                                  alt={pair.dragon.name || ""}
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded border border-border/50 object-cover -ml-1"
                                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                        {/* Stats row */}
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <Swords className="w-3.5 h-3.5 text-red-400" />
                            <span className="font-semibold">{teamStats.power}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="font-semibold">{teamStats.defense}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-green-400" />
                            <span className="font-semibold">{teamStats.health}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/30 rounded-lg p-4 text-center border border-dashed border-muted-foreground/30">
                        <p className="text-xs text-muted-foreground mb-2">Соберите команду перед боем</p>
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { switchTeam("pvp", selectedRarityTier); navigate("/team"); }}>
                          Собрать команду
                        </Button>
                      </div>
                    )}

                    {/* Bot toggle + info tooltip */}
                    <div className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-medium">Бот-режим</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[240px] text-xs bg-popover border-border z-50">
                            <p>Разрешить использовать вашу команду как бота для других игроков.</p>
                            <p className="mt-1 text-muted-foreground">Рейтинг бота не меняется при победах/поражениях.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Switch
                        checked={isBotEnabled}
                        onCheckedChange={handleToggleBot}
                        disabled={!hasTeam || togglingBot}
                      />
                    </div>

                    {/* CTA: Reward preview + Find button */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Взнос: <span className="text-foreground font-medium">{entryFee} ELL</span></span>
                        <span className="text-muted-foreground">Награда: <span className="text-primary font-bold">{entryFee * 2 - 10} ELL</span></span>
                      </div>
                      <Button
                        className="w-full h-11 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                        onClick={handleJoinQueue}
                        disabled={loading || !hasEnoughBalance}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        {!hasTeam ? "Собрать команду" : !hasEnoughBalance ? "Недостаточно ELL" : "Найти противника"}
                      </Button>
                      <button
                        onClick={() => setShowRulesDialog(true)}
                        className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 w-full text-center block transition-colors"
                      >
                        Подробнее о правилах арены
                      </button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* ═══════════════════════════════════════════════ */}
            {/* BELT 3: Leaderboard & History */}
            {/* ═══════════════════════════════════════════════ */}
            <Tabs defaultValue="leaderboard" className="w-full">
              <TabsList className="w-full grid grid-cols-2 h-11 bg-card/80 backdrop-blur">
                <TabsTrigger value="leaderboard" className="flex items-center gap-1.5 text-sm font-medium data-[state=active]:text-primary">
                  <Trophy className="w-4 h-4" />
                  Лидеры
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1.5 text-sm font-medium data-[state=active]:text-primary">
                  <History className="w-4 h-4" />
                  История
                </TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="mt-2">
                <PvPLeaderboard currentWallet={walletAddress} rarityTier={selectedRarityTier} />
              </TabsContent>

              <TabsContent value="history" className="mt-2">
                <PvPMatchHistory walletAddress={walletAddress} rarityTier={selectedRarityTier} />
              </TabsContent>
            </Tabs>

            {/* Season rewards summary (compact) */}
            {activeSeason && seasonRewardPreview && (
              <Card className="bg-card/60 backdrop-blur border-primary/10">
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap">
                    <Trophy className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>Сезон:</span>
                    {seasonRewardPreview.tierReward && (
                      <span>Тир <span className="text-primary font-medium">{seasonRewardPreview.tierReward.ellReward} ELL</span></span>
                    )}
                    {seasonRewardPreview.leagueReward && seasonRewardPreview.leagueReward.ellReward > 0 && (
                      <span>+ Лига ★{selectedRarityTier} <span className="text-primary font-medium">{seasonRewardPreview.leagueReward.ellReward} ELL</span></span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Team Preview Dialog */}
        <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
          <DialogContent className="max-w-md bg-card border-border">
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

        {/* Rules Dialog */}
        <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                Правила PvP Арены
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <h4 className="font-medium text-foreground mb-1">Лиги</h4>
                <p>Лига N разрешает карты редкости N и ниже. Каждая лига имеет независимый рейтинг и таблицу лидеров.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Вступительный взнос</h4>
                <p>100 ELL за бой. Победитель получает 190 ELL (90% пула). При отмене поиска — полный возврат.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Рейтинг</h4>
                <div className="space-y-1">
                  <div>• Победа → <span className="text-green-500">+Elo</span></div>
                  <div>• Поражение → <span className="text-red-500">-Elo</span></div>
                  <div>• Ваш бот победил/проиграл → <span className="text-muted-foreground">рейтинг не меняется</span></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Бот-режим</h4>
                <p>Ваша команда может биться с игроками, пока вы офлайн. Это не влияет на ваш рейтинг.</p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-1">Поиск</h4>
                <p>После 30 секунд поиска реального игрока автоматически подбирается бот-противник.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
