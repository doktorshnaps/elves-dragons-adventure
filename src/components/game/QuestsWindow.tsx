import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Quest } from "@/types/quests";
import { ScrollText } from "lucide-react";

const INITIAL_QUESTS: Quest[] = [
  {
    id: "daily-1",
    title: "Победить 3 противников",
    description: "Победите 3 противников в подземелье",
    type: "daily",
    progress: 0,
    target: 3,
    reward: { coins: 100 },
    completed: false,
    claimed: false,
  },
  {
    id: "daily-2",
    title: "Использовать 2 зелья",
    description: "Используйте 2 зелья здоровья",
    type: "daily",
    progress: 0,
    target: 2,
    reward: { coins: 50 },
    completed: false,
    claimed: false,
  },
  {
    id: "weekly-1",
    title: "Пройти 5 уровней",
    description: "Пройдите 5 уровней подземелья",
    type: "weekly",
    progress: 0,
    target: 5,
    reward: { coins: 500 },
    completed: false,
    claimed: false,
  },
  {
    id: "social-1",
    title: "Подписаться на CryptoFun News",
    description: "Подпишитесь на наш новостной канал t.me/CryptoFun_n",
    type: "social",
    progress: 0,
    target: 1,
    reward: { coins: 200 },
    completed: false,
    claimed: false,
  },
  {
    id: "social-2",
    title: "Присоединиться к чату CryptoFun",
    description: "Присоединитесь к нашему чату t.me/CryptoFun_Chat_t",
    type: "social",
    progress: 0,
    target: 1,
    reward: { coins: 200 },
    completed: false,
    claimed: false,
  },
];

export const QuestsWindow = () => {
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>(() => {
    const savedQuests = localStorage.getItem("gameQuests");
    if (savedQuests) {
      return JSON.parse(savedQuests);
    }
    return INITIAL_QUESTS;
  });

  useEffect(() => {
    localStorage.setItem("gameQuests", JSON.stringify(quests));
  }, [quests]);

  const handleClaimReward = (quest: Quest) => {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScrollText className="w-4 h-4" />
          Задания
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] bg-game-surface border-game-primary">
        <SheetHeader>
          <SheetTitle className="text-game-primary">Задания</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[80vh] mt-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-game-primary">Ежедневные задания</h3>
              {quests
                .filter((quest) => quest.type === "daily")
                .map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-game-background rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-game-primary">{quest.title}</h4>
                        <p className="text-sm text-gray-400">{quest.description}</p>
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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-game-primary">Еженедельные задания</h3>
              {quests
                .filter((quest) => quest.type === "weekly")
                .map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-game-background rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-game-primary">{quest.title}</h4>
                        <p className="text-sm text-gray-400">{quest.description}</p>
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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-game-primary">Поддержка проекта</h3>
              {quests
                .filter((quest) => quest.type === "social")
                .map((quest) => (
                  <div
                    key={quest.id}
                    className="bg-game-background rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-game-primary">{quest.title}</h4>
                        <p 
                          className="text-sm text-blue-400 cursor-pointer hover:underline"
                          onClick={() => handleSocialClick(quest.description.split(' ').pop() || '')}
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
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};