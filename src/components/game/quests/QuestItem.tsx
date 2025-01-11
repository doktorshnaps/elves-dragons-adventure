import { Quest } from "@/types/quests";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuestItemProps {
  quest: Quest;
  onClaimReward: (quest: Quest) => void;
}

export const QuestItem = ({ quest, onClaimReward }: QuestItemProps) => {
  const progressPercentage = (quest.progress / quest.target) * 100;
  const isCompleted = quest.progress >= quest.target;

  return (
    <div className="bg-game-background rounded-lg p-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-game-primary">{quest.title}</h4>
          <p className="text-sm text-gray-400">{quest.description}</p>
        </div>
        {isCompleted && !quest.claimed && (
          <Button
            onClick={() => onClaimReward(quest)}
            size="sm"
            className="bg-game-accent hover:bg-game-accent/90 w-full sm:w-auto"
          >
            Получить
          </Button>
        )}
        {quest.claimed && (
          <span className="text-sm text-gray-400">Получено</span>
        )}
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <div className="flex justify-between text-sm text-gray-400">
        <span>Прогресс: {quest.progress}/{quest.target}</span>
        <span>Награда: {quest.reward.coins} монет</span>
      </div>
    </div>
  );
};