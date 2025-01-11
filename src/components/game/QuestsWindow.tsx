import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Quest } from "@/types/quests";
import { ScrollText } from "lucide-react";
import { QuestSection } from "./quests/QuestSection";

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
  }
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
    const handleQuestProgress = (event: CustomEvent) => {
      const { questId, progress } = event.detail;
      
      setQuests(currentQuests =>
        currentQuests.map(quest => {
          if (quest.id === questId) {
            const newProgress = Math.min(quest.target, progress);
            return {
              ...quest,
              progress: newProgress,
              completed: newProgress >= quest.target
            };
          }
          return quest;
        })
      );
    };

    // Add event listener for quest progress updates
    window.addEventListener('questProgress' as any, handleQuestProgress);

    return () => {
      window.removeEventListener('questProgress' as any, handleQuestProgress);
    };
  }, []);

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
      const newBalance = currentBalance + quest.reward.coins;
      localStorage.setItem("gameBalance", String(newBalance));
      
      window.dispatchEvent(new Event('balanceUpdate'));
    }

    toast({
      title: "Награда получена!",
      description: `Вы получили ${quest.reward.coins} монет`,
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ScrollText className="w-4 h-4" />
          Задания
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:w-[540px] bg-game-surface border-game-primary">
        <SheetHeader>
          <SheetTitle className="text-game-primary">Задания</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[80vh] mt-4">
          <div className="space-y-6 pr-4">
            <QuestSection
              title="Ежедневные задания"
              quests={quests.filter((quest) => quest.type === "daily")}
              onClaimReward={handleClaimReward}
            />
            
            <QuestSection
              title="Еженедельные задания"
              quests={quests.filter((quest) => quest.type === "weekly")}
              onClaimReward={handleClaimReward}
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};