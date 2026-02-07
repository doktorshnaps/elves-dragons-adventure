import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trophy, Clock, Plus, StopCircle, Gift, Loader2, Calendar, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { usePvPSeason, PvPSeason, SeasonLeaderboardEntry } from "@/hooks/usePvPSeason";
import { toast } from "sonner";
import { BonusRewardEditor, BonusRewardDisplay, BonusReward } from "./BonusRewardEditor";
import { PlacementRewardEditor, PlacementRewardDisplay, PlacementReward } from "./PlacementRewardEditor";

const TIER_LABELS: Record<string, string> = {
  bronze: "Бронза",
  silver: "Серебро",
  gold: "Золото",
  platinum: "Платина",
  diamond: "Алмаз",
  master: "Мастер",
  legend: "Легенда",
};

const LEAGUE_NAMES: Record<string, string> = {
  "1": "Обычные",
  "2": "Необычные",
  "3": "Редкие",
  "4": "Эпические",
  "5": "Легендарные",
  "6": "Мифические",
  "7": "Божественные",
  "8": "Трансцендентные",
};

interface TierConfig {
  icon: string;
  min_elo: number;
  max_elo: number;
  ell_reward: number;
  bonus_card?: string | boolean;
  bonus_rewards?: BonusReward[];
  placement_rewards?: PlacementReward[];
  title?: boolean;
}

type PerLeagueRewardsConfig = Record<string, Record<string, TierConfig>>;

const TIER_TEMPLATE: Record<string, TierConfig> = {
  bronze:   { icon: "🥉", min_elo: 0,    max_elo: 1199, ell_reward: 500 },
  silver:   { icon: "🥈", min_elo: 1200, max_elo: 1399, ell_reward: 1500 },
  gold:     { icon: "🥇", min_elo: 1400, max_elo: 1599, ell_reward: 3000 },
  platinum: { icon: "💎", min_elo: 1600, max_elo: 1799, ell_reward: 5000 },
  diamond:  { icon: "💠", min_elo: 1800, max_elo: 1999, ell_reward: 10000 },
  master:   { icon: "👑", min_elo: 2000, max_elo: 2199, ell_reward: 20000 },
  legend:   { icon: "🏆", min_elo: 2200, max_elo: 99999, ell_reward: 50000 },
};

function generateDefaultPerLeagueRewards(): PerLeagueRewardsConfig {
  const config: PerLeagueRewardsConfig = {};
  for (let i = 1; i <= 8; i++) {
    config[String(i)] = JSON.parse(JSON.stringify(TIER_TEMPLATE));
  }
  return config;
}

const DEFAULT_PER_LEAGUE_REWARDS = generateDefaultPerLeagueRewards();

function isPerLeagueFormat(config: any): boolean {
  if (!config || typeof config !== 'object') return false;
  const keys = Object.keys(config);
  return keys.length > 0 && keys.some(k => /^\d+$/.test(k));
}

function convertToPerLeague(config: any): PerLeagueRewardsConfig {
  if (isPerLeagueFormat(config)) return config;
  const perLeague: PerLeagueRewardsConfig = {};
  for (let i = 1; i <= 8; i++) {
    perLeague[String(i)] = JSON.parse(JSON.stringify(config));
  }
  return perLeague;
}

const DEFAULT_LEAGUE_REWARDS_CONFIG: Record<string, { name: string; ell_reward: number }> = {
  "1": { name: "Обычные",         ell_reward: 0 },
  "2": { name: "Необычные",       ell_reward: 100 },
  "3": { name: "Редкие",          ell_reward: 300 },
  "4": { name: "Эпические",       ell_reward: 500 },
  "5": { name: "Легендарные",     ell_reward: 1000 },
  "6": { name: "Мифические",      ell_reward: 2000 },
  "7": { name: "Божественные",    ell_reward: 5000 },
  "8": { name: "Трансцендентные", ell_reward: 10000 },
};

export const PvPSeasonAdmin: React.FC = () => {
  const { accountId } = useWalletContext();
  const { activeSeason, allSeasons, countdown, refetchSeason, refetchAllSeasons, fetchSeasonLeaderboard } = usePvPSeason();

  // Create season form
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("30");
  const [rewardsConfig, setRewardsConfig] = useState<PerLeagueRewardsConfig>(DEFAULT_PER_LEAGUE_REWARDS);
  const [leagueRewardsConfig, setLeagueRewardsConfig] = useState(DEFAULT_LEAGUE_REWARDS_CONFIG);
  const [creating, setCreating] = useState(false);

  // Edit rewards
  const [editingRewards, setEditingRewards] = useState(false);
  const [editRewards, setEditRewards] = useState<PerLeagueRewardsConfig>(DEFAULT_PER_LEAGUE_REWARDS);
  const [editingLeagueRewards, setEditingLeagueRewards] = useState(false);
  const [editLeagueRewards, setEditLeagueRewards] = useState<typeof DEFAULT_LEAGUE_REWARDS_CONFIG>(DEFAULT_LEAGUE_REWARDS_CONFIG);

  // Selected league for tier rewards editing
  const [selectedRewardLeague, setSelectedRewardLeague] = useState("1");
  const [selectedCreateLeague, setSelectedCreateLeague] = useState("1");

  // Season leaderboard
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<SeasonLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Actions loading
  const [endingAction, setEndingAction] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [savingRewards, setSavingRewards] = useState(false);
  const [savingLeagueRewards, setSavingLeagueRewards] = useState(false);

  useEffect(() => {
    if (activeSeason?.rewards_config) {
      setEditRewards(convertToPerLeague(activeSeason.rewards_config));
    }
    if (activeSeason?.league_rewards_config && Object.keys(activeSeason.league_rewards_config).length > 0) {
      setEditLeagueRewards(activeSeason.league_rewards_config as typeof DEFAULT_LEAGUE_REWARDS_CONFIG);
    }
  }, [activeSeason]);

  const handleCreateSeason = async () => {
    if (!newName.trim() || !accountId) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.rpc("admin_create_pvp_season", {
        p_admin_wallet_address: accountId,
        p_name: newName.trim(),
        p_duration_days: parseInt(newDuration) || 30,
        p_rewards_config: rewardsConfig as any,
        p_league_rewards_config: leagueRewardsConfig as any,
      });
      if (error) throw error;
      toast.success(`Сезон «${newName}» создан!`);
      setNewName("");
      setNewDuration("30");
      refetchSeason();
      refetchAllSeasons();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEndSeason = async () => {
    if (!activeSeason || !accountId) return;
    setEndingAction(true);
    try {
      const { error } = await supabase.rpc("admin_end_pvp_season", {
        p_admin_wallet_address: accountId,
        p_season_id: activeSeason.id,
      });
      if (error) throw error;
      toast.success("Сезон завершён!");
      refetchSeason();
      refetchAllSeasons();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setEndingAction(false);
    }
  };

  const handleDistributeRewards = async (seasonId: string) => {
    if (!accountId) return;
    setDistributing(true);
    try {
      const { data, error } = await supabase.rpc("admin_distribute_season_rewards", {
        p_admin_wallet_address: accountId,
        p_season_id: seasonId,
      });
      if (error) throw error;
      const result = data as any;
      const leagueInfo = result.total_league_ell_distributed > 0
        ? ` + ${result.total_league_ell_distributed} ELL (лиги)`
        : "";
      toast.success(`Награды распределены! ${result.players_rewarded} игроков получили ${result.total_ell_distributed} ELL (тиры)${leagueInfo}`);
      refetchAllSeasons();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setDistributing(false);
    }
  };

  const handleSaveRewards = async () => {
    if (!activeSeason || !accountId) {
      toast.error("Нет активного сезона или кошелёк не подключён");
      return;
    }
    setSavingRewards(true);
    try {
      const { error } = await supabase.rpc("admin_update_pvp_season", {
        p_admin_wallet_address: accountId,
        p_season_id: activeSeason.id,
        p_rewards_config: editRewards as any,
      });
      if (error) throw error;
      toast.success("Награды по тирам обновлены!");
      setEditingRewards(false);
      refetchSeason();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSavingRewards(false);
    }
  };

  const handleSaveLeagueRewards = async () => {
    if (!activeSeason || !accountId) return;
    setSavingLeagueRewards(true);
    try {
      const { error } = await supabase.rpc("admin_update_pvp_season", {
        p_admin_wallet_address: accountId,
        p_season_id: activeSeason.id,
        p_league_rewards_config: editLeagueRewards as any,
      });
      if (error) throw error;
      toast.success("Награды по лигам обновлены!");
      setEditingLeagueRewards(false);
      refetchSeason();
    } catch (err: any) {
      toast.error("Ошибка: " + err.message);
    } finally {
      setSavingLeagueRewards(false);
    }
  };

  const handleViewLeaderboard = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    setLeaderboardLoading(true);
    const data = await fetchSeasonLeaderboard(seasonId);
    setLeaderboard(data);
    setLeaderboardLoading(false);
  };

  const updateRewardValue = (league: string, tier: string, field: string, value: number) => {
    setEditRewards(prev => ({
      ...prev,
      [league]: {
        ...prev[league],
        [tier]: { ...prev[league]?.[tier], [field]: value },
      },
    }));
  };

  const updateLeagueRewardValue = (league: string, value: number) => {
    setEditLeagueRewards(prev => ({
      ...prev,
      [league]: { ...prev[league], ell_reward: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Current Season */}
      <Card className="bg-black/40 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Текущий сезон
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSeason ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-white/60">Название</div>
                  <div className="text-white font-medium">{activeSeason.name}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Номер</div>
                  <div className="text-white font-medium">#{activeSeason.season_number}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">До окончания</div>
                  <div className="text-yellow-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {countdown}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Окончание</div>
                  <div className="text-white/80 text-sm">{new Date(activeSeason.ends_at).toLocaleDateString("ru-RU")}</div>
                </div>
              </div>

              {/* Rewards Config - Per League */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white/80 font-medium">Награды по тирам</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingRewards(!editingRewards)}
                    className="text-xs"
                  >
                    {editingRewards ? "Отмена" : "Редактировать"}
                  </Button>
                </div>

                {/* League selector */}
                <div className="mb-3">
                  <Select value={selectedRewardLeague} onValueChange={setSelectedRewardLeague}>
                    <SelectTrigger className="w-full h-8 text-xs bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAGUE_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>★{key} {name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(() => {
                  const currentConfig = editingRewards
                    ? (editRewards[selectedRewardLeague] || {})
                    : ((convertToPerLeague(activeSeason.rewards_config))[selectedRewardLeague] || {});

                  return (
                    <div className="grid gap-2">
                      {Object.entries(currentConfig)
                        .sort(([, a], [, b]) => a.min_elo - b.min_elo)
                        .map(([tierKey, config]) => (
                          <div key={tierKey} className="p-2 bg-white/5 rounded-lg space-y-1">
                            <div className="flex items-center gap-3">
                              <div className="w-20 text-sm text-white/80">
                                {config.icon || "•"} {TIER_LABELS[tierKey] || tierKey}
                              </div>
                              <div className="text-xs text-white/50 w-24">
                                {config.min_elo}-{config.max_elo === 99999 ? "∞" : config.max_elo}
                              </div>
                              {editingRewards ? (
                                <Input
                                  type="number"
                                  value={config.ell_reward}
                                  onChange={e => updateRewardValue(selectedRewardLeague, tierKey, "ell_reward", parseInt(e.target.value) || 0)}
                                  className="w-24 h-7 text-xs"
                                />
                              ) : (
                                <div className="text-yellow-400 text-sm font-medium">{config.ell_reward} ELL</div>
                              )}
                            </div>
                            {editingRewards ? (
                              <>
                                <BonusRewardEditor
                                  rewards={config.bonus_rewards || []}
                                  onChange={(rewards) => {
                                    setEditRewards(prev => ({
                                      ...prev,
                                      [selectedRewardLeague]: {
                                        ...prev[selectedRewardLeague],
                                        [tierKey]: { ...prev[selectedRewardLeague]?.[tierKey], bonus_rewards: rewards },
                                      },
                                    }));
                                  }}
                                />
                                <PlacementRewardEditor
                                  rewards={config.placement_rewards || []}
                                  onChange={(placementRewards) => {
                                    setEditRewards(prev => ({
                                      ...prev,
                                      [selectedRewardLeague]: {
                                        ...prev[selectedRewardLeague],
                                        [tierKey]: { ...prev[selectedRewardLeague]?.[tierKey], placement_rewards: placementRewards },
                                      },
                                    }));
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <BonusRewardDisplay rewards={config.bonus_rewards} />
                                <PlacementRewardDisplay rewards={config.placement_rewards} />
                              </>
                            )}
                          </div>
                        ))}
                    </div>
                  );
                })()}

                {editingRewards && (
                  <Button onClick={handleSaveRewards} disabled={savingRewards} className="mt-2 w-full" size="sm">
                    {savingRewards ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Сохранить награды (все лиги)
                  </Button>
                )}
              </div>

              {/* League Rewards Config */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-white/80 font-medium">Награды по лигам</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingLeagueRewards(!editingLeagueRewards)}
                    className="text-xs"
                  >
                    {editingLeagueRewards ? "Отмена" : "Редактировать"}
                  </Button>
                </div>

                <div className="grid gap-2">
                  {Object.entries(editingLeagueRewards ? editLeagueRewards : (
                    (activeSeason.league_rewards_config && Object.keys(activeSeason.league_rewards_config).length > 0)
                      ? activeSeason.league_rewards_config as typeof DEFAULT_LEAGUE_REWARDS_CONFIG
                      : DEFAULT_LEAGUE_REWARDS_CONFIG
                  )).map(([leagueKey, config]) => {
                    const leagueConfig = config as any;
                    return (
                      <div key={leagueKey} className="p-2 bg-white/5 rounded-lg space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="w-28 text-sm text-white/80">
                            ★{leagueKey} {LEAGUE_NAMES[leagueKey] || leagueConfig.name}
                          </div>
                          {editingLeagueRewards ? (
                            <Input
                              type="number"
                              value={leagueConfig.ell_reward}
                              onChange={e => updateLeagueRewardValue(leagueKey, parseInt(e.target.value) || 0)}
                              className="w-24 h-7 text-xs"
                            />
                          ) : (
                            <div className="text-yellow-400 text-sm font-medium">{leagueConfig.ell_reward} ELL</div>
                          )}
                        </div>
                        {editingLeagueRewards ? (
                          <BonusRewardEditor
                            rewards={leagueConfig.bonus_rewards || []}
                            onChange={(rewards) => {
                              setEditLeagueRewards(prev => ({
                                ...prev,
                                [leagueKey]: { ...prev[leagueKey], bonus_rewards: rewards },
                              }));
                            }}
                          />
                        ) : (
                          <BonusRewardDisplay rewards={leagueConfig.bonus_rewards} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {editingLeagueRewards && (
                  <Button onClick={handleSaveLeagueRewards} disabled={savingLeagueRewards} className="mt-2 w-full" size="sm">
                    {savingLeagueRewards ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Сохранить награды по лигам
                  </Button>
                )}
              </div>

              {/* End Season */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={endingAction}>
                    <StopCircle className="w-4 h-4 mr-2" />
                    Завершить сезон досрочно
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Завершить сезон?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Сезон «{activeSeason.name}» будет завершён. Это действие необратимо.
                      После завершения нужно будет раздать награды.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={handleEndSeason}>Завершить</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="text-center text-white/60 py-4">
              Нет активного сезона. Создайте новый сезон ниже.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Season */}
      <Card className="bg-black/40 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Plus className="w-5 h-5" />
            Создать новый сезон
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-xs">Название</Label>
              <Input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Сезон 2: Драконы"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Длительность (дней)</Label>
              <Input
                type="number"
                value={newDuration}
                onChange={e => setNewDuration(e.target.value)}
                placeholder="30"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white/70 text-xs mb-2 block">Награды по тирам (ELL) — по лигам</Label>
            <div className="mb-2">
              <Select value={selectedCreateLeague} onValueChange={setSelectedCreateLeague}>
                <SelectTrigger className="w-full h-8 text-xs bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAGUE_NAMES).map(([key, name]) => (
                    <SelectItem key={key} value={key}>★{key} {name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              {Object.entries(rewardsConfig[selectedCreateLeague] || TIER_TEMPLATE)
                .sort(([, a], [, b]) => a.min_elo - b.min_elo)
                .map(([tierKey, config]) => (
                <div key={tierKey} className="p-2 bg-white/5 rounded-lg space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-20 text-sm text-white/80">{config.icon} {TIER_LABELS[tierKey]}</div>
                    <div className="text-xs text-white/50 w-24">{config.min_elo}-{config.max_elo === 99999 ? "∞" : config.max_elo}</div>
                    <Input
                      type="number"
                      value={config.ell_reward}
                      onChange={e => {
                        setRewardsConfig(prev => ({
                          ...prev,
                          [selectedCreateLeague]: {
                            ...prev[selectedCreateLeague],
                            [tierKey]: { ...prev[selectedCreateLeague]?.[tierKey], ell_reward: parseInt(e.target.value) || 0 },
                          },
                        }));
                      }}
                      className="w-24 h-7 text-xs"
                    />
                    <span className="text-xs text-white/50">ELL</span>
                  </div>
                  <BonusRewardEditor
                    rewards={config.bonus_rewards || []}
                    onChange={(rewards) => {
                      setRewardsConfig(prev => ({
                        ...prev,
                        [selectedCreateLeague]: {
                          ...prev[selectedCreateLeague],
                          [tierKey]: { ...prev[selectedCreateLeague]?.[tierKey], bonus_rewards: rewards },
                        },
                      }));
                    }}
                  />
                  <PlacementRewardEditor
                    rewards={config.placement_rewards || []}
                    onChange={(placementRewards) => {
                      setRewardsConfig(prev => ({
                        ...prev,
                        [selectedCreateLeague]: {
                          ...prev[selectedCreateLeague],
                          [tierKey]: { ...prev[selectedCreateLeague]?.[tierKey], placement_rewards: placementRewards },
                        },
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-white/70 text-xs mb-2 block">Награды по лигам</Label>
            <div className="grid gap-2">
              {Object.entries(leagueRewardsConfig).map(([leagueKey, config]) => (
                <div key={leagueKey} className="p-2 bg-white/5 rounded-lg space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-28 text-sm text-white/80">★{leagueKey} {LEAGUE_NAMES[leagueKey]}</div>
                    <Input
                      type="number"
                      value={config.ell_reward}
                      onChange={e => {
                        setLeagueRewardsConfig(prev => ({
                          ...prev,
                          [leagueKey]: { ...prev[leagueKey], ell_reward: parseInt(e.target.value) || 0 },
                        }));
                      }}
                      className="w-24 h-7 text-xs"
                    />
                    <span className="text-xs text-white/50">ELL</span>
                  </div>
                  <BonusRewardEditor
                    rewards={(config as any).bonus_rewards || []}
                    onChange={(rewards) => {
                      setLeagueRewardsConfig(prev => ({
                        ...prev,
                        [leagueKey]: { ...prev[leagueKey], bonus_rewards: rewards },
                      }));
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleCreateSeason} disabled={creating || !newName.trim()} className="w-full">
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Создать сезон
          </Button>

          {activeSeason && (
            <p className="text-xs text-yellow-400">
              ⚠️ Создание нового сезона автоматически завершит текущий сезон «{activeSeason.name}».
            </p>
          )}
        </CardContent>
      </Card>

      {/* Season History */}
      <Card className="bg-black/40 border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5" />
            История сезонов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allSeasons.length === 0 ? (
            <div className="text-center text-white/60 py-4">Нет сезонов</div>
          ) : (
            <div className="space-y-3">
              {allSeasons.map(season => (
                <div key={season.id} className="p-3 bg-white/5 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">#{season.season_number} {season.name}</span>
                      {season.is_active ? (
                        <Badge className="bg-green-600 text-white text-[10px]">Активен</Badge>
                      ) : season.rewards_distributed ? (
                        <Badge className="bg-blue-600 text-white text-[10px]">Награды розданы</Badge>
                      ) : (
                        <Badge className="bg-yellow-600 text-black text-[10px]">Ожидает наград</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => handleViewLeaderboard(season.id)}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Лидеры
                      </Button>
                      {!season.is_active && !season.rewards_distributed && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-xs h-7" disabled={distributing}>
                              <Gift className="w-3 h-3 mr-1" />
                              Раздать
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Раздать награды?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Все игроки сезона «{season.name}» получат ELL на основе их финального тира.
                                Это действие необратимо.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDistributeRewards(season.id)}>
                                Раздать награды
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-white/50">
                    {new Date(season.starts_at).toLocaleDateString("ru-RU")} — {new Date(season.ends_at).toLocaleDateString("ru-RU")}
                  </div>

                  {/* Leaderboard for this season */}
                  {selectedSeasonId === season.id && (
                    <div className="mt-2 border-t border-white/10 pt-2">
                      {leaderboardLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : leaderboard.length === 0 ? (
                        <div className="text-center text-white/50 text-xs py-2">Нет данных</div>
                      ) : (
                        <div className="space-y-1 max-h-60 overflow-y-auto">
                          {leaderboard.map((entry) => {
                            const tierReward = getTierReward(season, entry.elo, entry.rarity_tier);
                            return (
                              <div key={entry.wallet_address} className="flex items-center gap-2 text-xs p-1.5 bg-white/5 rounded">
                                <span className="w-6 text-center text-white/60">#{entry.rank}</span>
                                <span className="flex-1 text-white/90 truncate">
                                  {entry.wallet_address.slice(0, 8)}...{entry.wallet_address.slice(-4)}
                                </span>
                                <span className="text-white/60">{entry.elo} Elo</span>
                                <span className="text-green-400">{entry.wins}W</span>
                                <span className="text-red-400">{entry.losses}L</span>
                                {tierReward > 0 && (
                                  <span className="text-yellow-400 font-medium">{tierReward} ELL</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function getTierReward(season: PvPSeason, elo: number, league?: number): number {
  const config = season.rewards_config;
  if (!config) return 0;
  
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
}
