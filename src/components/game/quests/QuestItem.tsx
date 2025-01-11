import { Quest } from "@/types/quests";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface QuestItemProps {
  quest: Quest;
  onClaimReward: (quest: Quest) => void;
  onSocialClick?: (url: string) => void;
}

export const QuestItem = ({ quest, onClaimReward, onSocialClick }: QuestItemProps) => {
  return (
    <div className="bg-game-background rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-game-primary">{quest.title}</h4>
          {quest.type === 'social' ? (
            <p 
              className="text-sm text-blue-400 cursor-pointer hover:underline"
              onClick={() => onSocialClick?.(quest.description.split(' ').pop() || '')}
            >
              {quest.description}
            </p>
          ) : (
            <p className="text-sm text-gray-400">{quest.description}</p>
          )}
        </div>
        {quest.completed && !quest.claimed && (
          <Button
            onClick={() => onClaimReward(quest)}
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
  );
};