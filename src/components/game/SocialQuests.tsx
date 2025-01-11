import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface SocialQuest {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: { coins: number };
  completed: boolean;
  claimed: boolean; // Changed from 'false' to 'boolean'
}

const SOCIAL_QUESTS: SocialQuest[] = [
  {
    id: "social-1",
    title: "Подписаться на CryptoFun News",
    description: "t.me/CryptoFun_n",
    progress: 0,
    target: 1,
    reward: { coins: 200 },
    completed: false,
    claimed: false,
  },
  {
    id: "social-2",
    title: "Присоединиться к чату CryptoFun",
    description: "t.me/CryptoFun_Chat_t",
    progress: 0,
    target: 1,
    reward: { coins: 200 },
    completed: false,
    claimed: false,
  },
];

export const SocialQuests = () => {
  const { toast } = useToast();
  const [quests, setQuests] = useState<SocialQuest[]>(() => {
    const savedQuests = localStorage.getItem("socialQuests");
    return savedQuests ? JSON.parse(savedQuests) : SOCIAL_QUESTS;
  });

  useEffect(() => {
    localStorage.setItem("socialQuests", JSON.stringify(quests));
  }, [quests]);

  const handleClaimReward = (quest: SocialQuest) => {
    if (!quest.completed || quest.claimed) return;

    const updatedQuests = quests.map((q) =>
      q.id === quest.id ? { ...q, claimed: true } : q
    );
    setQuests(updatedQuests);

    if (quest.reward.coins) {
      const currentBalance = Number(localStorage.getItem("gameBalance") || "0");
      localStorage.setItem("gameBalance", String(currentBalance + quest.reward.coins));
    }

    toast({
      title: "Награда получена!",
      description: `Вы получили ${quest.reward.coins} монет`,
    });
  };

  const handleSocialClick = (url: string) => {
    window.open(`https://${url}`, '_blank');
  };

  return (
    <Card className="p-6 bg-game-surface border-game-accent">
      <h2 className="text-xl font-bold text-game-accent mb-4">Поддержка проекта</h2>
      <div className="space-y-4">
        {quests.map((quest) => (
          <div key={quest.id} className="bg-game-background rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-game-primary">{quest.title}</h4>
                <p 
                  className="text-sm text-blue-400 cursor-pointer hover:underline"
                  onClick={() => handleSocialClick(quest.description)}
                >
                  {quest.description}
                </p>
              </div>
              {quest.completed && !quest.claimed && (
                <Button
                  onClick={() => handleClaimReward(quest)}
                  size="sm"
                  className="bg-game-accent hover:bg-game-accent/90"
                >
                  Получить
                </Button>
              )}
              {quest.claimed && (
                <span className="text-sm text-gray-400">Получено</span>
              )}
            </div>
            <Progress value={(quest.progress / quest.target) * 100} />
            <div className="text-sm text-gray-400">
              Награда: {quest.reward.coins} монет
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};