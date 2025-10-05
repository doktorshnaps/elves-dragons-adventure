import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
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
  const { accountId } = useWallet();
  const { gameData, updateGameData } = useGameData();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [progress, setProgress] = useState<Map<string, QuestProgress>>(new Map());
  const [loading, setLoading] = useState(true);

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

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from("user_quest_progress")
        .select("*")
        .eq("wallet_address", accountId);

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
      
      // Preserve current visited state for quests not yet completed
      progress.forEach((currentProgress, questId) => {
        if (!progressMap.has(questId) && currentProgress.visited) {
          progressMap.set(questId, currentProgress);
        }
      });
      
      setProgress(progressMap);
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
    setProgress(new Map(progress.set(quest.id, {
      quest_id: quest.id,
      completed: questProgress?.completed || false,
      claimed: questProgress?.claimed || false,
      visited: true,
    })));
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

    // Optimistic UI update
    const optimistic = new Map(progress);
    optimistic.set(quest.id, { quest_id: quest.id, completed: true, claimed: true, visited: true });
    setProgress(optimistic);

    try {
      // Mark as claimed
      const { error: claimError } = await supabase.rpc('mark_quest_claimed', {
        p_wallet_address: accountId,
        p_quest_id: quest.id,
      });

      if (claimError) throw claimError;

      // Update balance
      await updateGameData({
        balance: gameData.balance + quest.reward_coins,
      });

      toast({
        title: "Награда получена!",
        description: `Вы получили ${quest.reward_coins} ELL`,
      });
    } catch (error) {
      // Revert optimistic update on error
      const reverted = new Map(progress);
      reverted.set(quest.id, questProgress);
      setProgress(reverted);

      console.error("Error claiming reward:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось получить награду",
        variant: "destructive",
      });
    }
  };

  const handleLinkClick = (url: string) => {
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <Card className="p-6 bg-game-surface border-game-accent">
        <p className="text-center text-gray-400">Загрузка заданий...</p>
      </Card>
    );
  }

  if (quests.length === 0) {
    return (
      <Card className="p-6 bg-game-surface border-game-accent">
        <p className="text-center text-gray-400">Заданий пока нет</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-game-surface border-game-accent">
      <h2 className="text-xl font-bold text-game-accent mb-4">Поддержка проекта</h2>
      <div className="space-y-4">
        {quests.map((quest) => {
          const questProgress = progress.get(quest.id);
          const isCompleted = questProgress?.completed || false;
          const isClaimed = questProgress?.claimed || false;
          const isVisited = questProgress?.visited || false;

          return (
            <div key={quest.id} className="bg-game-background rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-4">
                {quest.image_url && (
                  <img
                    src={quest.image_url}
                    alt={quest.title}
                    className="w-48 h-48 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-game-primary">{quest.title}</h4>
                      <p className="text-sm text-gray-400">{quest.description}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {!isVisited && !isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleVisitQuest(quest)}
                          size="sm"
                          className="bg-game-accent hover:bg-game-accent/90"
                        >
                          Выполнить
                        </Button>
                      )}
                      {isVisited && !isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleCompleteQuest(quest)}
                          size="sm"
                          className="bg-game-accent hover:bg-game-accent/90"
                        >
                          Я подписался
                        </Button>
                      )}
                      {isCompleted && !isClaimed && (
                        <Button
                          onClick={() => handleClaimReward(quest)}
                          size="sm"
                          className="bg-game-accent hover:bg-game-accent/90"
                        >
                          Получить
                        </Button>
                      )}
                      {isClaimed && (
                        <span className="text-sm text-gray-400">Выполнено</span>
                      )}
                    </div>
                  </div>
                  <Progress value={isClaimed ? 100 : isCompleted ? 50 : 0} className="mt-2" />
                  <div className="text-sm text-gray-400 mt-1">
                    Награда: {quest.reward_coins} ELL
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};