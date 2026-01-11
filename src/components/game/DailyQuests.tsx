import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useGameData } from "@/hooks/useGameData";
import { useLanguage } from "@/hooks/useLanguage";
import { Clock, Calendar, Gift, CheckCircle2 } from "lucide-react";

interface DailyQuest {
  id: string;
  quest_template_id: string;
  quest_type: string;
  quest_key: string;
  title_ru: string;
  title_en: string;
  description_ru: string;
  description_en: string;
  target_value: number;
  current_value: number;
  reward_type: string;
  reward_amount: number;
  icon: string | null;
  is_completed: boolean;
  is_claimed: boolean;
  reset_at: string;
}

export const DailyQuests = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { updateGameData } = useGameData();
  const { language } = useLanguage();
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (accountId) {
      loadQuests();
    }
  }, [accountId]);

  const loadQuests = async () => {
    if (!accountId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_daily_quests', {
        p_wallet_address: accountId
      });

      if (error) throw error;
      setQuests(data || []);
    } catch (error) {
      console.error("Error loading daily quests:", error);
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось загрузить задания" : "Failed to load quests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (quest: DailyQuest) => {
    if (!accountId || !quest.is_completed || quest.is_claimed) return;

    setClaiming(quest.id);

    try {
      const { data, error } = await supabase.rpc('claim_daily_quest_reward', {
        p_wallet_address: accountId,
        p_progress_id: quest.id
      });

      if (error) throw error;

      const result = data as { success: boolean; reward_type: string; reward_amount: number; new_balance: number };

      // Update local state
      setQuests(prev => prev.map(q => 
        q.id === quest.id ? { ...q, is_claimed: true } : q
      ));

      // Update game data
      if (result.reward_type === 'ell') {
        await updateGameData({ balance: result.new_balance });
      } else if (result.reward_type === 'mgt') {
        await updateGameData({ mgtBalance: result.new_balance });
      } else if (result.reward_type === 'gold') {
        await updateGameData({ gold: result.new_balance });
      }

      const rewardLabel = result.reward_type === 'ell' ? 'ELL' : result.reward_type === 'mgt' ? 'mGT' : 'Gold';
      toast({
        title: language === 'ru' ? "Награда получена!" : "Reward claimed!",
        description: `+${result.reward_amount} ${rewardLabel}`,
      });
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        title: language === 'ru' ? "Ошибка" : "Error",
        description: language === 'ru' ? "Не удалось получить награду" : "Failed to claim reward",
        variant: "destructive",
      });
    } finally {
      setClaiming(null);
    }
  };

  const getTimeUntilReset = (resetAt: string, questType: string) => {
    const resetDate = new Date(resetAt);
    const now = new Date();
    
    let nextReset: Date;
    if (questType === 'daily') {
      nextReset = new Date(resetDate);
      nextReset.setUTCDate(nextReset.getUTCDate() + 1);
    } else {
      nextReset = new Date(resetDate);
      nextReset.setUTCDate(nextReset.getUTCDate() + 7);
    }

    const diff = nextReset.getTime() - now.getTime();
    if (diff <= 0) return language === 'ru' ? "Скоро обновится" : "Resetting soon";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return language === 'ru' ? `${days}д ${hours % 24}ч` : `${days}d ${hours % 24}h`;
    }
    return `${hours}${language === 'ru' ? 'ч' : 'h'} ${minutes}${language === 'ru' ? 'м' : 'm'}`;
  };

  const getRewardLabel = (rewardType: string) => {
    switch (rewardType) {
      case 'ell': return 'ELL';
      case 'mgt': return 'mGT';
      case 'gold': return 'Gold';
      default: return rewardType;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <p className="text-center text-black">
          {language === 'ru' ? "Загрузка заданий..." : "Loading quests..."}
        </p>
      </div>
    );
  }

  const dailyQuests = quests.filter(q => q.quest_type === 'daily');
  const weeklyQuests = quests.filter(q => q.quest_type === 'weekly');

  return (
    <div className="space-y-6">
      {/* Daily Quests */}
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-black" />
          <h2 className="text-xl font-bold text-black">
            {language === 'ru' ? "Ежедневные задания" : "Daily Quests"}
          </h2>
        </div>
        
        {dailyQuests.length === 0 ? (
          <p className="text-center text-black/60">
            {language === 'ru' ? "Нет доступных заданий" : "No quests available"}
          </p>
        ) : (
          <div className="space-y-4">
            {dailyQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                language={language}
                claiming={claiming}
                onClaim={handleClaimReward}
                getTimeUntilReset={getTimeUntilReset}
                getRewardLabel={getRewardLabel}
              />
            ))}
          </div>
        )}
      </div>

      {/* Weekly Quests */}
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-black" />
          <h2 className="text-xl font-bold text-black">
            {language === 'ru' ? "Недельные задания" : "Weekly Quests"}
          </h2>
        </div>
        
        {weeklyQuests.length === 0 ? (
          <p className="text-center text-black/60">
            {language === 'ru' ? "Нет доступных заданий" : "No quests available"}
          </p>
        ) : (
          <div className="space-y-4">
            {weeklyQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                language={language}
                claiming={claiming}
                onClaim={handleClaimReward}
                getTimeUntilReset={getTimeUntilReset}
                getRewardLabel={getRewardLabel}
                isWeekly
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface QuestCardProps {
  quest: DailyQuest;
  language: string;
  claiming: string | null;
  onClaim: (quest: DailyQuest) => void;
  getTimeUntilReset: (resetAt: string, questType: string) => string;
  getRewardLabel: (rewardType: string) => string;
  isWeekly?: boolean;
}

const QuestCard = ({ 
  quest, 
  language, 
  claiming, 
  onClaim, 
  getTimeUntilReset, 
  getRewardLabel,
  isWeekly 
}: QuestCardProps) => {
  const progress = Math.min((quest.current_value / quest.target_value) * 100, 100);
  const title = language === 'ru' ? quest.title_ru : quest.title_en;
  const description = language === 'ru' ? quest.description_ru : quest.description_en;

  return (
    <div 
      className={`bg-black/50 border-2 rounded-3xl p-5 backdrop-blur-sm transition-all hover:bg-black/70 ${
        isWeekly ? 'border-yellow-400/50' : 'border-white'
      }`}
      style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
          isWeekly ? 'bg-yellow-400/20' : 'bg-white/10'
        }`}>
          {quest.icon || (isWeekly ? '🏆' : '📋')}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-white text-lg">{title}</h4>
                {isWeekly && (
                  <span className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full">
                    {language === 'ru' ? 'Недельное' : 'Weekly'}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/80 mt-1">{description}</p>
            </div>
            
            <div className="flex flex-col gap-2 items-end">
              {quest.is_claimed ? (
                <span className="flex items-center gap-1 text-sm text-green-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'ru' ? 'Получено' : 'Claimed'}
                </span>
              ) : quest.is_completed ? (
                <Button
                  onClick={() => onClaim(quest)}
                  disabled={claiming === quest.id}
                  size="sm"
                  className="bg-green-500 text-white hover:bg-green-600 border-2 border-green-400 rounded-xl font-semibold"
                >
                  <Gift className="w-4 h-4 mr-1" />
                  {claiming === quest.id 
                    ? (language === 'ru' ? '...' : '...') 
                    : (language === 'ru' ? 'Забрать' : 'Claim')}
                </Button>
              ) : (
                <span className="text-xs text-white/60">
                  {getTimeUntilReset(quest.reset_at, quest.quest_type)}
                </span>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>{quest.current_value} / {quest.target_value}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${isWeekly ? '[&>div]:bg-yellow-400' : ''}`}
            />
          </div>

          {/* Reward */}
          <div className="text-sm text-white/80 mt-2 font-medium flex items-center gap-1">
            <Gift className="w-4 h-4" />
            {language === 'ru' ? 'Награда:' : 'Reward:'} {quest.reward_amount} {getRewardLabel(quest.reward_type)}
          </div>
        </div>
      </div>
    </div>
  );
};
