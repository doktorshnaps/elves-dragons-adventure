import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWalletContext } from "@/contexts/WalletConnectContext";
import { useGameData } from "@/hooks/useGameData";

interface Quest {
  id: string;
  title: string;
  description: string;
  link_url: string;
  image_url: string | null;
  reward_coins: number;
  is_active: boolean;
}

interface QuestProgress {
  quest_id: string;
  completed: boolean;
  claimed: boolean;
  visited: boolean; // Tracking if user clicked to visit the link
}

export const SocialQuests = () => {
  const { toast } = useToast();
  const { accountId } = useWalletContext();
  const { gameData, updateGameData } = useGameData();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Map<string, QuestProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  // Local persistence helpers
  const storageKey = `questProgress:${accountId ?? 'anon'}`;
  const getLocalProgress = (): Record<string, QuestProgress> => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {} as any;
    }
  };
  const persistProgress = (map: Map<string, QuestProgress>) => {
    const obj: Record<string, Omit<QuestProgress, 'quest_id'> & { quest_id?: string }> = {};
    map.forEach((v, k) => {
      obj[k] = { completed: v.completed, claimed: v.claimed, visited: v.visited } as any;
    });
    try { localStorage.setItem(storageKey, JSON.stringify(obj)); } catch {}
  };

  useEffect(() => {
    if (accountId) {
      loadQuestsAndProgress();

      // Subscribe to real-time updates
      const subscription = supabase
        .channel('quest-progress-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_quest_progress',
            filter: `wallet_address=eq.${accountId}`,
          },
          (payload) => {
            console.log('Quest progress changed:', payload);
            loadQuestsAndProgress();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [accountId]);

  const loadQuestsAndProgress = async () => {
    try {
      // Load active quests
      const { data: questsData, error: questsError } = await supabase
        .from("quests")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (questsError) throw questsError;
      setQuests(questsData || []);

      // Load user progress via RPC (bypass RLS)
      const { data: progressData, error: progressError } = await supabase
        .rpc('get_user_quest_progress', { p_wallet_address: accountId });

      if (progressError) throw progressError;

      const progressMap = new Map<string, QuestProgress>();
      progressData?.forEach((p) => {
        const isVisited = p.completed || p.claimed; // If completed or claimed, must have been visited
        progressMap.set(p.quest_id, {
          quest_id: p.quest_id,
          completed: p.completed,
          claimed: p.claimed,
          visited: isVisited,
        });
      });

      // Merge with local storage (persist optimistic state across reloads)
      const local = getLocalProgress();
      Object.entries(local).forEach(([id, lp]: any) => {
        const cur = progressMap.get(id);
        if (cur) {
          progressMap.set(id, {
            ...cur,
            completed: cur.completed || lp.completed,
            claimed: cur.claimed || lp.claimed,
            visited: cur.visited || lp.visited,
          });
        } else {
          progressMap.set(id, {
            quest_id: id,
            completed: lp.completed || false,
            claimed: lp.claimed || false,
            visited: lp.visited || false,
          } as QuestProgress);
        }
      });
      
      // Preserve current visited state for quests not yet completed
      progress.forEach((currentProgress, questId) => {
        if (!progressMap.has(questId) && currentProgress.visited) {
          progressMap.set(questId, currentProgress);
        }
      });
      
      setProgress(progressMap);
      persistProgress(progressMap);
    } catch (error) {
      console.error("Error loading quests:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задания",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVisitQuest = (quest: Quest) => {
    const questProgress = progress.get(quest.id);
    
    // Open the quest link
    window.open(quest.link_url, "_blank");
    
    // Mark as visited
    const newMap = new Map(progress.set(quest.id, {
      quest_id: quest.id,
      completed: questProgress?.completed || false,
      claimed: questProgress?.claimed || false,
      visited: true,
    }));
    setProgress(newMap);
    persistProgress(newMap);
  };

  const handleCompleteQuest = async (quest: Quest) => {
    const questProgress = progress.get(quest.id);
    
    console.log('handleCompleteQuest called', { 
      questId: quest.id, 
      questProgress,
      accountId 
    });

    if (questProgress?.completed) {
      console.log('Quest already completed, skipping');
      return;
    }

    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Кошелек не подключен",
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI update
    const optimistic = new Map(progress);
    optimistic.set(quest.id, { quest_id: quest.id, completed: true, claimed: false, visited: true });
    setProgress(optimistic);
    persistProgress(optimistic);

    try {
      console.log('Completing quest via RPC...');
      const { error } = await supabase.rpc('complete_user_quest', {
        p_wallet_address: accountId,
        p_quest_id: quest.id,
      });

      if (error) {
        console.error('Supabase RPC error:', error);
        throw error;
      }

      console.log('Quest completed successfully');

      toast({
        title: "Задание выполнено",
        description: "Теперь можно получить награду",
      });
    } catch (error) {
      // Revert optimistic update on error
      const reverted = new Map(progress);
      reverted.set(quest.id, questProgress ?? { quest_id: quest.id, completed: false, claimed: false, visited: true });
      setProgress(reverted);
      persistProgress(reverted);

      console.error("Error completing quest:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить задание как выполненное",
        variant: "destructive",
      });
    }
  };

  const handleClaimReward = async (quest: Quest) => {
    const questProgress = progress.get(quest.id);
    if (!questProgress?.completed || questProgress?.claimed) return;

    if (!accountId) {
      toast({
        title: "Ошибка",
        description: "Кошелек не подключен",
        variant: "destructive",
      });
      return;
    }

    // Optimistic UI update
    const optimistic = new Map(progress);
    optimistic.set(quest.id, { quest_id: quest.id, completed: true, claimed: true, visited: true });
    setProgress(optimistic);
    persistProgress(optimistic);

    try {
      // Claim via RPC - atomically marks as claimed and adds balance
      const { data, error } = await supabase.rpc('claim_quest_and_reward', {
        p_wallet_address: accountId,
        p_quest_id: quest.id,
      });

      if (error) {
        console.error('Claim error:', error);
        throw error;
      }

      console.log('Quest claimed successfully:', data);

      // Parse returned data
      const result = data as any;
      const newBalance = result?.balance ?? gameData.balance;
      const rewardAmount = result?.reward ?? quest.reward_coins;

      // Force reload game data to sync balance
      await updateGameData({ balance: newBalance });

      toast({
        title: "Награда получена!",
        description: `Вы получили ${rewardAmount} ELL`,
      });
    } catch (error: any) {
      // Revert optimistic update on error
      const reverted = new Map(progress);
      reverted.set(quest.id, questProgress);
      setProgress(reverted);
      persistProgress(reverted);

      console.error("Error claiming reward:", error);
      
      const errorMsg = error?.message?.includes('already claimed') 
        ? 'Награда уже получена ранее' 
        : 'Не удалось получить награду';

      toast({
        title: "Ошибка",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <p className="text-center text-black">Загрузка заданий...</p>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
        <p className="text-center text-black">Заданий пока нет</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-transparent backdrop-blur-sm rounded-2xl border-2 border-black">
      <h2 className="text-xl font-bold text-black mb-6">Поддержка проекта</h2>
      <div className="space-y-4">
        {quests.map((quest) => {
          const questProgress = progress.get(quest.id);
          const isCompleted = questProgress?.completed || false;
          const isClaimed = questProgress?.claimed || false;
          const isVisited = questProgress?.visited || false;

          return (
            <div 
              key={quest.id} 
              className="bg-black/50 border-2 border-white rounded-3xl p-6 backdrop-blur-sm transition-all hover:bg-black/70"
              style={{ boxShadow: '-33px 15px 10px rgba(0, 0, 0, 0.6)' }}
            >
              <div className="flex items-start gap-4">
                {quest.image_url && (
                  <img
                    src={quest.image_url}
                    alt={quest.title}
                    className="w-32 h-32 rounded-xl object-cover border-2 border-white"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-white text-lg">{quest.title}</h4>
                      <p className="text-sm text-white/80 mt-1">{quest.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {!isVisited && !isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleVisitQuest(quest)}
                          size="sm"
                          className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
                        >
                          Выполнить
                        </Button>
                      )}
                      {isVisited && !isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleCompleteQuest(quest)}
                          size="sm"
                          className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
                        >
                          Я подписался
                        </Button>
                      )}
                      {isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleClaimReward(quest)}
                          size="sm"
                          className="bg-white text-black hover:bg-white/90 border-2 border-black rounded-xl font-semibold"
                        >
                          Получить
                        </Button>
                      )}
                      {isClaimed && (
                        <span className="text-sm text-white font-semibold">✓ Выполнено</span>
                      )}
                    </div>
                  </div>
                  <Progress value={isClaimed ? 100 : isCompleted ? 50 : 0} className="mt-3" />
                  <div className="text-sm text-white/80 mt-2 font-medium">
                    Награда: {quest.reward_coins} ELL
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};